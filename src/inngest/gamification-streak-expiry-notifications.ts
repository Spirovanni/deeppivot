/**
 * Inngest cron: Notify users when streak is about to expire.
 *
 * A streak is "at risk" when user activity happened last week but not this week.
 * This job sends one reminder notification per user per week.
 */

import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { startOfWeek, subWeeks } from "date-fns";
import { inngest } from "@/src/inngest/client";
import { db } from "@/src/db";
import {
  notificationsTable,
  systemSettingsTable,
  userGamificationTable,
  usersTable,
} from "@/src/db/schema";
import { createNotification } from "@/src/lib/notifications";

const STREAK_REMINDER_TITLE = "Keep your streak alive";
const STREAK_REMINDER_LINK = "/dashboard/interviews";

export const gamificationStreakExpiryNotifications = inngest.createFunction(
  {
    id: "gamification-streak-expiry-notifications",
    name: "Gamification Streak Expiry Notifications",
    retries: 1,
  },
  { cron: "0 14 * * *" }, // 14:00 UTC daily
  async ({ step }) => {
    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now);
    const startOfPreviousWeek = startOfWeek(subWeeks(now, 1));

    const atRiskUsers = await step.run("load-at-risk-users", async () => {
      return db
        .select({
          userId: userGamificationTable.userId,
          currentStreak: userGamificationTable.currentStreak,
          lastActivityAt: userGamificationTable.lastActivityAt,
        })
        .from(userGamificationTable)
        .innerJoin(usersTable, eq(userGamificationTable.userId, usersTable.id))
        .where(
          and(
            eq(usersTable.isDeleted, false),
            gte(userGamificationTable.currentStreak, 1),
            gte(userGamificationTable.lastActivityAt, startOfPreviousWeek),
            lt(userGamificationTable.lastActivityAt, startOfCurrentWeek)
          )
        );
    });

    if (atRiskUsers.length === 0) {
      return { notified: 0, skippedAlreadyNotified: 0, checked: 0 };
    }

    const atRiskIds = atRiskUsers.map((user) => user.userId);
    const disabledRows = await step.run("load-disabled-gamification-users", async () => {
      return db
        .select({ key: systemSettingsTable.key, value: systemSettingsTable.value })
        .from(systemSettingsTable)
        .where(
          and(
            eq(systemSettingsTable.value, "false"),
            inArray(
              systemSettingsTable.key,
              atRiskIds.map((id) => `gamification:user:${id}:enabled`)
            )
          )
        );
    });
    const disabledIds = new Set(
      disabledRows
        .map((row) => row.key.match(/^gamification:user:(\d+):enabled$/)?.[1])
        .filter((value): value is string => Boolean(value))
        .map((value) => Number.parseInt(value, 10))
    );

    const alreadyNotifiedRows = await step.run(
      "load-already-notified-users",
      async () => {
        return db
          .select({ userId: notificationsTable.userId })
          .from(notificationsTable)
          .where(
            and(
              inArray(notificationsTable.userId, atRiskIds),
              eq(notificationsTable.title, STREAK_REMINDER_TITLE),
              gte(notificationsTable.createdAt, startOfCurrentWeek)
            )
          );
      }
    );

    const alreadyNotifiedIds = new Set(
      alreadyNotifiedRows.map((row) => row.userId)
    );

    let notified = 0;
    for (const user of atRiskUsers) {
      if (disabledIds.has(user.userId)) continue;
      if (alreadyNotifiedIds.has(user.userId)) continue;

      await step.run(`notify-user-${user.userId}`, async () => {
        await createNotification({
          userId: user.userId,
          title: STREAK_REMINDER_TITLE,
          body: `Your ${user.currentStreak}-week streak will reset soon. Complete a practice interview this week to keep it going.`,
          type: "career",
          link: STREAK_REMINDER_LINK,
        });
      });

      notified += 1;
    }

    return {
      checked: atRiskUsers.length,
      notified,
      skippedAlreadyNotified: atRiskUsers.length - notified,
      windowStart: startOfCurrentWeek.toISOString(),
    };
  }
);

