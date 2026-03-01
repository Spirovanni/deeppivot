/**
 * Gamification: points and streaks (Phase 16.4)
 *
 * Awards points for user actions (job applications, interview completion, etc.)
 * and tracks weekly streaks. Uses user_gamification table.
 */

import { db } from "@/src/db";
import { userGamificationTable, gamificationEventsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

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
 * Non-blocking: errors are logged but do not throw.
 */
export async function addPoints(
  userId: number,
  event: GamificationEvent,
  pointsOverride?: number,
  metadata?: Record<string, unknown>
): Promise<{ pointsAdded: number; newTotal: number } | null> {
  const points = pointsOverride ?? GAMIFICATION_POINTS[event];
  if (points <= 0) return null;

  try {
    const [row] = await db
      .select({ points: userGamificationTable.points })
      .from(userGamificationTable)
      .where(eq(userGamificationTable.userId, userId))
      .limit(1);

    let newTotal: number;

    if (row) {
      newTotal = row.points + points;
      await db
        .update(userGamificationTable)
        .set({
          points: newTotal,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userGamificationTable.userId, userId));
    } else {
      const [inserted] = await db
        .insert(userGamificationTable)
        .values({
          userId,
          points,
          currentStreak: 0,
          highestStreak: 0,
          lastActivityAt: new Date(),
        })
        .returning();

      if (!inserted) return null;
      newTotal = inserted.points;
    }

    // Log to audit table (fire-and-forget)
    logGamificationEvent(userId, event, points, metadata);

    return { pointsAdded: points, newTotal };
  } catch (err) {
    console.error("[gamification] addPoints failed:", err);
    return null;
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
 * Hook: Add points when user completes a career plan milestone.
 * Call from PATCH /api/plans/[id] and updateMilestone() server action
 * when status transitions to "completed".
 */
export async function addPointsForMilestoneCompletion(
  userId: number,
  milestoneId: number,
  milestoneTitle?: string
): Promise<{ pointsAdded: number; newTotal: number } | null> {
  return addPoints(userId, "MILESTONE_COMPLETED", undefined, {
    milestoneId,
    milestoneTitle,
  });
}
