/**
 * Gamification: points and streaks (Phase 16.4)
 *
 * Awards points for user actions (job applications, interview completion, etc.)
 * and tracks weekly streaks. Uses user_gamification table.
 */

import { db } from "@/src/db";
import { userGamificationTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

/** Points awarded per action (configurable) */
export const GAMIFICATION_POINTS = {
  JOB_APPLICATION_SUBMITTED: 10,
  INTERVIEW_COMPLETED: 15,
  MILESTONE_COMPLETED: 5,
} as const;

export type GamificationEvent = keyof typeof GAMIFICATION_POINTS;

/**
 * Add points for a user action. Upserts user_gamification row if needed.
 * Non-blocking: errors are logged but do not throw.
 */
export async function addPoints(
  userId: number,
  event: GamificationEvent,
  pointsOverride?: number
): Promise<{ pointsAdded: number; newTotal: number } | null> {
  const points = pointsOverride ?? GAMIFICATION_POINTS[event];
  if (points <= 0) return null;

  try {
    const [row] = await db
      .select({ points: userGamificationTable.points })
      .from(userGamificationTable)
      .where(eq(userGamificationTable.userId, userId))
      .limit(1);

    if (row) {
      const newTotal = row.points + points;
      await db
        .update(userGamificationTable)
        .set({
          points: newTotal,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userGamificationTable.userId, userId));
      return { pointsAdded: points, newTotal };
    }

    const [inserted] = await db
      .insert(userGamificationTable)
      .values({
        userId,
        points,
        currentStreak: 0,
        highestStreak: 0,
        lastActivityAt: new Date(),
      })
      .returning({ points: userGamificationTable.points });

    return inserted
      ? { pointsAdded: points, newTotal: inserted.points }
      : null;
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
