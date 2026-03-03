"use server";

import { db } from "@/src/db";
import {
  gamificationEventsTable,
  systemSettingsTable,
  userGamificationTable,
  usersTable,
} from "@/src/db/schema";
import { and, count, desc, eq, gt, isNull, sql, sum } from "drizzle-orm";
import { requireAdmin } from "@/src/lib/admin-auth";

export type AdminGamificationMetrics = {
  totalUsers: number;
  enabledUsers: number;
  disabledUsers: number;
  usersWithActivity7d: number;
  events7d: number;
  pointsAwarded7d: number;
  averagePointsPerUser: number;
  usersWithStreak: number;
  topEventTypes: Array<{ eventType: string; count: number }>;
  topUsers: Array<{
    userId: number;
    name: string;
    points: number;
    currentStreak: number;
    highestStreak: number;
    updatedAt: Date;
  }>;
};

/**
 * Admin reporting metrics for gamification engagement (deeppivot-290).
 */
export async function getAdminGamificationMetrics(): Promise<AdminGamificationMetrics> {
  await requireAdmin();

  const [
    [totalUsersRow],
    [disabledUsersRow],
    [usersWithActivity7dRow],
    [events7dRow],
    [points7dRow],
    [avgPointsRow],
    [usersWithStreakRow],
    topEventTypesRows,
    topUsersRows,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(usersTable)
      .where(isNull(usersTable.deletedAt)),
    db
      .select({ count: count() })
      .from(systemSettingsTable)
      .where(
        and(
          sql`${systemSettingsTable.key} like 'gamification:user:%:enabled'`,
          eq(systemSettingsTable.value, "false")
        )
      ),
    db
      .select({
        count: sql<number>`coalesce(count(distinct ${gamificationEventsTable.userId}), 0)`,
      })
      .from(gamificationEventsTable)
      .where(
        gt(
          gamificationEventsTable.createdAt,
          sql`now() - interval '7 days'`
        )
      ),
    db
      .select({ count: count() })
      .from(gamificationEventsTable)
      .where(
        gt(
          gamificationEventsTable.createdAt,
          sql`now() - interval '7 days'`
        )
      ),
    db
      .select({
        points: sum(gamificationEventsTable.points),
      })
      .from(gamificationEventsTable)
      .where(
        gt(
          gamificationEventsTable.createdAt,
          sql`now() - interval '7 days'`
        )
      ),
    db
      .select({
        avg: sql<number>`coalesce(avg(${userGamificationTable.points}), 0)`,
      })
      .from(userGamificationTable),
    db
      .select({ count: count() })
      .from(userGamificationTable)
      .where(gt(userGamificationTable.currentStreak, 0)),
    db
      .select({
        eventType: gamificationEventsTable.eventType,
        count: count(),
      })
      .from(gamificationEventsTable)
      .groupBy(gamificationEventsTable.eventType)
      .orderBy(desc(count()))
      .limit(5),
    db
      .select({
        userId: userGamificationTable.userId,
        name: usersTable.name,
        points: userGamificationTable.points,
        currentStreak: userGamificationTable.currentStreak,
        highestStreak: userGamificationTable.highestStreak,
        updatedAt: userGamificationTable.updatedAt,
      })
      .from(userGamificationTable)
      .innerJoin(usersTable, eq(userGamificationTable.userId, usersTable.id))
      .where(isNull(usersTable.deletedAt))
      .orderBy(desc(userGamificationTable.points))
      .limit(10),
  ]);

  const totalUsers = Number(totalUsersRow?.count ?? 0);
  const disabledUsers = Number(disabledUsersRow?.count ?? 0);
  const enabledUsers = Math.max(totalUsers - disabledUsers, 0);

  return {
    totalUsers,
    enabledUsers,
    disabledUsers,
    usersWithActivity7d: Number(usersWithActivity7dRow?.count ?? 0),
    events7d: Number(events7dRow?.count ?? 0),
    pointsAwarded7d: Number(points7dRow?.points ?? 0),
    averagePointsPerUser: Math.round(Number(avgPointsRow?.avg ?? 0)),
    usersWithStreak: Number(usersWithStreakRow?.count ?? 0),
    topEventTypes: topEventTypesRows.map((row) => ({
      eventType: row.eventType,
      count: Number(row.count),
    })),
    topUsers: topUsersRows,
  };
}

