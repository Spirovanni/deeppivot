/**
 * Gamification: points and streaks (Phase 16.4)
 *
 * Awards points for user actions (job applications, interview completion, etc.)
 * and tracks weekly streaks. Uses user_gamification table.
 */

import { db } from "@/src/db";
import { userGamificationTable, gamificationEventsTable } from "@/src/db/schema";
import { eq, lt, and, gt } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { startOfWeek, isSameWeek, subWeeks } from "date-fns";
import { inngest } from "@/src/inngest/client";
import { isGamificationEnabled } from "@/src/lib/gamification-preferences";

/** Points awarded per action (configurable) */
export const GAMIFICATION_POINTS = {
  JOB_APPLICATION_SUBMITTED: 10,
  INTERVIEW_COMPLETED: 15,
  MILESTONE_COMPLETED: 5,
} as const;

export type GamificationEvent = keyof typeof GAMIFICATION_POINTS;

/**
 * Returns UTC ISO string for date storage/comparison.
 * Use this for streak logic and any timezone-sensitive comparisons.
 */
export function toUtcIsoString(date: Date): string {
  return date.toISOString();
}

/**
 * Log a gamification event to the audit log.
 * Non-blocking: errors are logged but do not throw.
 */
export async function logGamificationEvent(
  userId: number,
  eventType: string,
  points: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(gamificationEventsTable).values({
      userId,
      eventType,
      points,
      metadata: metadata ?? null,
    });
  } catch (err) {
    console.error("[gamification] logGamificationEvent failed:", err);
  }
}

/**
 * Add points for a user action. Upserts user_gamification row if needed.
 * Also logs the event to the gamification_events audit table.
 *
 * Deduplication: if a `deduplicationKey` is provided (e.g. "milestone:42"),
 * the system checks the gamification_events audit log and skips if a matching
 * event was already recorded. This prevents exploits like toggling milestone
 * status to farm points.
 *
 * Non-blocking: errors are logged but do not throw.
 */
export async function addPoints(
  userId: number,
  event: GamificationEvent,
  pointsOverride?: number,
  metadata?: Record<string, unknown>
): Promise<{ pointsAdded: number; newTotal: number } | null> {
  const enabled = await isGamificationEnabled(userId);
  if (!enabled) return null;

  const points = pointsOverride ?? GAMIFICATION_POINTS[event];
  if (points <= 0) return null;

  try {
    // ── Deduplication check ───────────────────────────────────────────────
    // If metadata contains a deduplicationKey, ensure this exact event
    // hasn't already been awarded to prevent re-awarding exploits
    // (e.g. toggling milestone complete → planned → complete).
    const deduplicationKey = metadata?.deduplicationKey as string | undefined;
    if (deduplicationKey) {
      const priorEvents = await db
        .select({ metadata: gamificationEventsTable.metadata })
        .from(gamificationEventsTable)
        .where(
          and(
            eq(gamificationEventsTable.userId, userId),
            eq(gamificationEventsTable.eventType, event)
          )
        );

      const alreadyAwarded = priorEvents.some((e) => {
        const m = e.metadata as Record<string, unknown> | null;
        return m?.deduplicationKey === deduplicationKey;
      });

      if (alreadyAwarded) {
        return null; // Already awarded for this entity
      }
    }
    const [row] = await db
      .select()
      .from(userGamificationTable)
      .where(eq(userGamificationTable.userId, userId))
      .limit(1);

    const now = new Date();
    let newTotal: number;
    let newStreak: number = 1;
    let newHighestStreak: number = 0;

    if (row) {
      newTotal = row.points + points;
      newStreak = row.currentStreak;
      newHighestStreak = row.highestStreak;

      const lastActivity = row.lastActivityAt;

      if (!lastActivity) {
        newStreak = 1;
      } else {
        const lastActivityWeek = startOfWeek(lastActivity);
        const currentWeek = startOfWeek(now);

        if (isSameWeek(lastActivity, now)) {
          // Already active this week, streak stays same
          newStreak = row.currentStreak || 1;
        } else if (isSameWeek(lastActivity, subWeeks(now, 1))) {
          // Active last week, increment streak
          newStreak = (row.currentStreak || 0) + 1;
        } else {
          // Missed at least one full week, reset to 1
          newStreak = 1;
        }
      }

      newHighestStreak = Math.max(newHighestStreak, newStreak);

      await db
        .update(userGamificationTable)
        .set({
          points: newTotal,
          currentStreak: newStreak,
          highestStreak: newHighestStreak,
          lastActivityAt: now,
          updatedAt: now,
        })
        .where(eq(userGamificationTable.userId, userId));
    } else {
      newHighestStreak = 1;
      const [inserted] = await db
        .insert(userGamificationTable)
        .values({
          userId,
          points,
          currentStreak: 1,
          highestStreak: 1,
          lastActivityAt: now,
        })
        .returning();

      if (!inserted) return null;
      newTotal = inserted.points;
    }

    // Log to audit table (fire-and-forget)
    logGamificationEvent(userId, event, points, metadata);

    // Trigger badge evaluation (async)
    await inngest.send({
      name: "gamification/points.added",
      data: {
        userId,
        event,
        points,
        metadata,
      },
    });

    return { pointsAdded: points, newTotal };
  } catch (err) {
    console.error("[gamification] addPoints failed:", err);
    return null;
  }
}

/**
 * Resets streaks for users who have been inactive for more than a full calendar week.
 * A streak is considered alive if lastActivityAt is in the current week or the previous week.
 * If lastActivityAt < start of last week, the streak is expired.
 */
export async function resetExpiredStreaks(): Promise<{ resetCount: number }> {
  try {
    const now = new Date();
    const startOfPreviousWeek = startOfWeek(subWeeks(now, 1));

    // Find users with positive streaks but last activity before the start of the previous week
    const result = await db
      .update(userGamificationTable)
      .set({
        currentStreak: 0,
        updatedAt: now,
      })
      .where(
        and(
          gt(userGamificationTable.currentStreak, 0),
          lt(userGamificationTable.lastActivityAt, startOfPreviousWeek)
        )
      );

    return { resetCount: result.rowCount ?? 0 };
  } catch (err) {
    console.error("[gamification] resetExpiredStreaks failed:", err);
    return { resetCount: 0 };
  }
}

/**
 * Hook: Add points when user submits a job application (marketplace apply).
 * Call from POST /api/jobs/[jobId]/apply after successful insert.
 */
export async function addPointsForJobApplication(
  userId: number
): Promise<{ pointsAdded: number; newTotal: number } | null> {
  return addPoints(userId, "JOB_APPLICATION_SUBMITTED");
}

/**
 * Hook: Add points when user completes an interview session.
 * Call from endInterviewSession() after status set to "completed".
 * Deduplicated by sessionId — completing the same session twice won't double-award.
 */
export async function addPointsForInterviewCompletion(
  userId: number,
  sessionId: number,
  sessionType?: string,
  overallScore?: number | null
): Promise<{ pointsAdded: number; newTotal: number } | null> {
  return addPoints(userId, "INTERVIEW_COMPLETED", undefined, {
    deduplicationKey: `session:${sessionId}`,
    sessionId,
    sessionType,
    overallScore,
  });
}

/**
 * Hook: Add points when user completes a career plan milestone.
 * Call from PATCH /api/plans/[id] and updateMilestone() server action
 * when status transitions to "completed".
 * Deduplicated by milestoneId — toggling status won't re-award points.
 */
export async function addPointsForMilestoneCompletion(
  userId: number,
  milestoneId: number,
  milestoneTitle?: string
): Promise<{ pointsAdded: number; newTotal: number } | null> {
  return addPoints(userId, "MILESTONE_COMPLETED", undefined, {
    deduplicationKey: `milestone:${milestoneId}`,
    milestoneId,
    milestoneTitle,
  });
}

/**
 * Get points earned for completing a specific interview session.
 * Returns null if no gamification event was recorded for this session.
 * Phase 16.4 (deeppivot-286)
 */
export async function getPointsEarnedForInterviewSession(
  userId: number,
  sessionId: number
): Promise<number | null> {
  try {
    const [event] = await db
      .select({ points: gamificationEventsTable.points })
      .from(gamificationEventsTable)
      .where(
        and(
          eq(gamificationEventsTable.userId, userId),
          eq(gamificationEventsTable.eventType, "INTERVIEW_COMPLETED"),
          sql`(${gamificationEventsTable.metadata}->>'sessionId') = ${String(sessionId)}`
        )
      )
      .limit(1);

    return event?.points ?? null;
  } catch {
    return null;
  }
}
