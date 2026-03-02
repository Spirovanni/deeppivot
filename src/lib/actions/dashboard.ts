"use server";

import { db } from "@/src/db";
import {
  usersTable,
  careerMilestonesTable,
  interviewSessionsTable,
} from "@/src/db/schema";
import { eq, asc, desc, and, isNotNull, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

async function getDbUserId(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user.id;
}

export interface RecentSession {
  id: number;
  sessionType: string;
  status: string;
  startedAt: Date;
  overallScore: number | null;
}

export interface DashboardSummary {
  careerPlan: {
    total: number;
    completed: number;
    inProgress: number;
  };
  interviews: {
    total: number;
    completed: number;
    recent: RecentSession[];
    hoursPracticed: number;
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const userId = await getDbUserId();

  const [milestones, allSessions, recentSessions, totalSecondsRow] = await Promise.all([
    db
      .select({ status: careerMilestonesTable.status })
      .from(careerMilestonesTable)
      .where(eq(careerMilestonesTable.userId, userId))
      .orderBy(asc(careerMilestonesTable.orderIndex)),
    db
      .select({ status: interviewSessionsTable.status })
      .from(interviewSessionsTable)
      .where(eq(interviewSessionsTable.userId, userId)),
    db
      .select({
        id: interviewSessionsTable.id,
        sessionType: interviewSessionsTable.sessionType,
        status: interviewSessionsTable.status,
        startedAt: interviewSessionsTable.startedAt,
        overallScore: interviewSessionsTable.overallScore,
      })
      .from(interviewSessionsTable)
      .where(eq(interviewSessionsTable.userId, userId))
      .orderBy(desc(interviewSessionsTable.createdAt))
      .limit(5),
    db
      .select({
        totalSeconds: sql<number>`coalesce(sum(extract(epoch from ${interviewSessionsTable.endedAt} - ${interviewSessionsTable.startedAt})), 0)`,
      })
      .from(interviewSessionsTable)
      .where(
        and(
          eq(interviewSessionsTable.userId, userId),
          isNotNull(interviewSessionsTable.endedAt)
        )
      ),
  ]);

  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const inProgressMilestones = milestones.filter((m) => m.status === "in_progress").length;
  const completedSessionsCount = allSessions.filter((s) => s.status === "completed").length;
  const totalSeconds = Number(totalSecondsRow[0]?.totalSeconds ?? 0);
  const hoursPracticed = Math.round((totalSeconds / 3600) * 10) / 10;

  return {
    careerPlan: {
      total: milestones.length,
      completed: completedMilestones,
      inProgress: inProgressMilestones,
    },
    interviews: {
      total: allSessions.length,
      completed: completedSessionsCount,
      recent: recentSessions.map((s) => ({
        id: s.id,
        sessionType: s.sessionType,
        status: s.status,
        startedAt: s.startedAt,
        overallScore: s.overallScore,
      })),
      hoursPracticed,
    },
  };
}
