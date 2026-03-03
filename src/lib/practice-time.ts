import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { interviewSessionsTable } from "@/src/db/schema";

export type PracticeTimeAggregation = {
  totalSeconds: number;
  totalMinutes: number;
  thisWeekMinutes: number;
};

/**
 * Aggregates interview practice time for a user from session durations.
 * Uses completed sessions with both startedAt and endedAt timestamps.
 */
export async function getPracticeTimeAggregation(
  userId: number
): Promise<PracticeTimeAggregation> {
  const [totals] = await db
    .select({
      totalSeconds:
        sql<number>`coalesce(sum(extract(epoch from ${interviewSessionsTable.endedAt} - ${interviewSessionsTable.startedAt})), 0)`,
      weekSeconds:
        sql<number>`coalesce(sum(case when ${interviewSessionsTable.endedAt} >= now() - interval '7 days' then extract(epoch from ${interviewSessionsTable.endedAt} - ${interviewSessionsTable.startedAt}) else 0 end), 0)`,
    })
    .from(interviewSessionsTable)
    .where(
      and(
        eq(interviewSessionsTable.userId, userId),
        eq(interviewSessionsTable.status, "completed"),
        isNotNull(interviewSessionsTable.endedAt)
      )
    );

  const totalSeconds = Number(totals?.totalSeconds ?? 0);
  const weekSeconds = Number(totals?.weekSeconds ?? 0);

  return {
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    thisWeekMinutes: Math.round(weekSeconds / 60),
  };
}
