"use server";

import { db } from "@/src/db";
import {
  usersTable,
  careerMilestonesTable,
  interviewSessionsTable,
} from "@/src/db/schema";
import { eq, asc, desc } from "drizzle-orm";
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

export interface DashboardSummary {
  careerPlan: {
    total: number;
    completed: number;
    inProgress: number;
  };
  interviews: {
    total: number;
    completed: number;
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const userId = await getDbUserId();

  const [milestones, sessions] = await Promise.all([
    db
      .select({ status: careerMilestonesTable.status })
      .from(careerMilestonesTable)
      .where(eq(careerMilestonesTable.userId, userId))
      .orderBy(asc(careerMilestonesTable.orderIndex)),
    db
      .select({
        status: interviewSessionsTable.status,
      })
      .from(interviewSessionsTable)
      .where(eq(interviewSessionsTable.userId, userId))
      .orderBy(desc(interviewSessionsTable.createdAt)),
  ]);

  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const inProgressMilestones = milestones.filter((m) => m.status === "in_progress").length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;

  return {
    careerPlan: {
      total: milestones.length,
      completed: completedMilestones,
      inProgress: inProgressMilestones,
    },
    interviews: {
      total: sessions.length,
      completed: completedSessions,
    },
  };
}
