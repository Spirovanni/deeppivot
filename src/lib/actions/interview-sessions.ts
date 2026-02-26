"use server";

import { db } from "@/src/db";
import {
  interviewSessionsTable,
  interviewQuestionsTable,
  emotionSnapshotsTable,
  interviewFeedbackTable,
  emotionalAnalysesTable,
  usersTable,
} from "@/src/db/schema";
import { eq, avg, and, asc, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function getDbUser(): Promise<{ id: number; organizationId: string | null }> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [user] = await db
    .select({ id: usersTable.id, organizationId: usersTable.organizationId })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  if (!user) throw new Error("User not found");

  // Optionally sync orgId if relying on auth().orgId logic
  if (orgId && orgId !== user.organizationId) {
    user.organizationId = orgId;
  }

  return user;
}

export async function startInterviewSession(sessionType: string): Promise<number> {
  const user = await getDbUser();

  const [session] = await db
    .insert(interviewSessionsTable)
    .values({ userId: user.id, organizationId: user.organizationId, sessionType, status: "active" })
    .returning();

  return session.id;
}

export async function endInterviewSession(
  sessionId: number
): Promise<{ overallScore: number | null }> {
  const [result] = await db
    .select({ avgConfidence: avg(emotionSnapshotsTable.confidence) })
    .from(emotionSnapshotsTable)
    .where(eq(emotionSnapshotsTable.sessionId, sessionId));

  const overallScore = result?.avgConfidence
    ? Math.round(parseFloat(String(result.avgConfidence)) * 100)
    : null;

  await db
    .update(interviewSessionsTable)
    .set({
      status: "completed",
      endedAt: new Date(),
      overallScore,
      updatedAt: new Date(),
    })
    .where(eq(interviewSessionsTable.id, sessionId));

  revalidatePath("/dashboard/interviews");
  return { overallScore };
}

export async function getSessionDetail(sessionId: number) {
  const user = await getDbUser();
  const userId = user.id;

  const session = await db.query.interviewSessionsTable.findFirst({
    where: and(
      eq(interviewSessionsTable.id, sessionId),
      eq(interviewSessionsTable.userId, userId)
    ),
    with: {
      questions: { orderBy: [asc(interviewQuestionsTable.orderIndex)] },
    },
  });

  return session ?? null;
}

export async function getSessionEmotions(sessionId: number) {
  const user = await getDbUser();
  const userId = user.id;

  const [session] = await db
    .select({ id: interviewSessionsTable.id })
    .from(interviewSessionsTable)
    .where(
      and(
        eq(interviewSessionsTable.id, sessionId),
        eq(interviewSessionsTable.userId, userId)
      )
    )
    .limit(1);

  if (!session) return [];

  return db
    .select()
    .from(emotionSnapshotsTable)
    .where(eq(emotionSnapshotsTable.sessionId, sessionId))
    .orderBy(asc(emotionSnapshotsTable.capturedAt));
}

export async function getInterviewFeedback(sessionId: number) {
  const user = await getDbUser();
  const userId = user.id;

  const [session] = await db
    .select({ id: interviewSessionsTable.id })
    .from(interviewSessionsTable)
    .where(
      and(
        eq(interviewSessionsTable.id, sessionId),
        eq(interviewSessionsTable.userId, userId)
      )
    )
    .limit(1);

  if (!session) return null;

  const [feedback] = await db
    .select()
    .from(interviewFeedbackTable)
    .where(eq(interviewFeedbackTable.sessionId, sessionId))
    .orderBy(desc(interviewFeedbackTable.createdAt))
    .limit(1);

  return feedback ?? null;
}

export async function getEmotionalAnalysis(sessionId: number) {
  const user = await getDbUser();
  const userId = user.id;

  const [session] = await db
    .select({ id: interviewSessionsTable.id })
    .from(interviewSessionsTable)
    .where(
      and(
        eq(interviewSessionsTable.id, sessionId),
        eq(interviewSessionsTable.userId, userId)
      )
    )
    .limit(1);

  if (!session) return null;

  const [analysis] = await db
    .select()
    .from(emotionalAnalysesTable)
    .where(eq(emotionalAnalysesTable.sessionId, sessionId))
    .orderBy(desc(emotionalAnalysesTable.createdAt))
    .limit(1);

  return analysis ?? null;
}

export async function captureEmotionSnapshot(
  sessionId: number,
  emotions: Record<string, number>
): Promise<void> {
  const entries = Object.entries(emotions);
  if (entries.length === 0) return;

  const [dominantEmotion, confidence] = entries.sort(([, a], [, b]) => b - a)[0];

  await db.insert(emotionSnapshotsTable).values({
    sessionId,
    emotions,
    dominantEmotion,
    confidence,
  });
}
