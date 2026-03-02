"use server";

import { db } from "@/src/db";
import {
  interviewSessionsTable,
  interviewQuestionsTable,
  emotionSnapshotsTable,
  interviewFeedbackTable,
  emotionalAnalysesTable,
  usersTable,
  jobDescriptionsTable,
} from "@/src/db/schema";
import { eq, avg, and, asc, desc, ne } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { addPointsForInterviewCompletion } from "@/src/lib/gamification";
import { generateCompletion } from "@/src/lib/llm";
import { anonymize } from "@/src/lib/pii";
import { mapInterviewToSkills } from "@/src/lib/career-skills";

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
  sessionId: number,
  transcript?: Array<{ role: string; text: string }>
): Promise<{ overallScore: number | null; pointsAwarded: number | null }> {
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

  // Gamification: award points for interview completion
  let pointsAwarded: number | null = null;
  const [session] = await db
    .select({
      userId: interviewSessionsTable.userId,
      sessionType: interviewSessionsTable.sessionType,
    })
    .from(interviewSessionsTable)
    .where(eq(interviewSessionsTable.id, sessionId))
    .limit(1);

  if (session) {
    const gamResult = await addPointsForInterviewCompletion(
      session.userId,
      sessionId,
      session.sessionType,
      overallScore
    ).catch(() => null);
    pointsAwarded = gamResult?.pointsAdded ?? null;
  }

  // Generate feedback from ElevenLabs live transcript (fire-and-forget)
  if (transcript && transcript.length > 0) {
    generateFeedbackFromTranscript(sessionId, transcript).catch((err) =>
      console.error(`Feedback generation failed for session ${sessionId}:`, err)
    );
  }

  revalidatePath("/dashboard/interviews");
  return { overallScore, pointsAwarded };
}

/**
 * Generate AI feedback directly from ElevenLabs live transcript messages.
 * Bypasses the Vapi → R2 → Deepgram pipeline since ElevenLabs provides
 * real-time transcription via WebSocket.
 */
async function generateFeedbackFromTranscript(
  sessionId: number,
  messages: Array<{ role: string; text: string }>
) {
  // Build a readable transcript from the WebSocket messages
  const transcriptText = messages
    .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.text}`)
    .join("\n");

  if (transcriptText.trim().length < 20) return;

  // Insert fallback emotional analysis (ElevenLabs doesn't provide emotion data)
  await db.insert(emotionalAnalysesTable).values({
    sessionId,
    jobId: "elevenlabs-live-transcript",
    data: {
      snapshots: [],
      overallDominantEmotion: "Unknown",
      aggregateEmotions: [],
      unavailable: true,
    },
  });

  // Fetch past feedback for adaptive context
  const [session] = await db
    .select({ userId: interviewSessionsTable.userId })
    .from(interviewSessionsTable)
    .where(eq(interviewSessionsTable.id, sessionId))
    .limit(1);

  let pastFeedback: string[] = [];
  if (session?.userId) {
    const pastRows = await db
      .select({ content: interviewFeedbackTable.content })
      .from(interviewFeedbackTable)
      .innerJoin(
        interviewSessionsTable,
        eq(interviewSessionsTable.id, interviewFeedbackTable.sessionId)
      )
      .where(
        and(
          eq(interviewSessionsTable.userId, session.userId),
          ne(interviewFeedbackTable.sessionId, sessionId)
        )
      )
      .orderBy(desc(interviewFeedbackTable.createdAt))
      .limit(3);
    pastFeedback = pastRows
      .map((r) => {
        const c = r.content ?? "";
        return c.slice(0, 400) + (c.length > 400 ? "..." : "");
      })
      .filter((s) => s.length > 0);
  }

  const pastFeedbackContext =
    pastFeedback.length > 0
      ? `\n\n---\nPrevious feedback from this candidate's past interviews (use to highlight improvement or recurring issues):\n${pastFeedback.map((f, i) => `[Past ${i + 1}]\n${f}`).join("\n\n")}`
      : "";

  // Generate structured feedback via LLM
  const { content: feedbackContent } = await generateCompletion({
    messages: [
      {
        role: "system",
        content: `You are an expert interview coach. Generate structured, actionable feedback for a job interview practice session.

If previous feedback is provided, use it to:
- Highlight areas where the candidate has improved since last time
- Call out recurring issues that still need work
- Tailor suggestions to build on prior recommendations

Output format:
## Strengths
- Bullet points of what the candidate did well

## Areas for Improvement
- Bullet points of specific, actionable suggestions

## Emotional Tone
- Brief summary of how their delivery came across based on their word choice and conversation flow (note that voice emotion analysis was not available)

## Overall Recommendation
- 1-2 sentences with next steps.`,
      },
      {
        role: "user",
        content: `Interview transcript:\n\n${transcriptText}\n\n---\nEmotional analysis: Unavailable (voice emotion analysis was not performed for this session).${pastFeedbackContext}\n\nGenerate structured feedback.`,
      },
    ],
    maxTokens: 1500,
    temperature: 0.5,
  });

  // PII-anonymize and save
  const anonymizedFeedback = anonymize(feedbackContent);

  // Map to career skills
  const skillsMapping = await mapInterviewToSkills(
    transcriptText,
    feedbackContent,
    "Emotion analysis unavailable"
  ).catch(() => []);

  await db.insert(interviewFeedbackTable).values({
    sessionId,
    content: anonymizedFeedback,
    skillsMapping: skillsMapping.length > 0 ? skillsMapping : undefined,
  });
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

/**
 * Fetches the full extracted JD context for the feedback gap analysis panel.
 * Returns all JD fields needed to render skill coverage, responsibility gaps,
 * and experience requirements, or null if no JD is linked.
 */
export async function getSessionGapAnalysis(sessionId: number) {
  const user = await getDbUser();

  const session = await db.query.interviewSessionsTable.findFirst({
    where: and(
      eq(interviewSessionsTable.id, sessionId),
      eq(interviewSessionsTable.userId, user.id)
    ),
    with: {
      jobDescription: true,
    },
  });

  if (!session?.jobDescriptionId || !session.jobDescription) return null;

  const jd = session.jobDescription;
  if (jd.status !== "extracted" || !jd.extractedData) return null;

  const extracted = jd.extractedData as {
    jobTitle?: string;
    companyName?: string | null;
    technicalSkillsRequired?: string[];
    softSkillsRequired?: string[];
    yearsOfExperience?: string | null;
    primaryResponsibilities?: string[];
    companyCulture?: string | null;
    likelyInterviewTopics?: string[];
  };

  return {
    jobTitle: extracted.jobTitle ?? jd.title ?? "Unknown Role",
    companyName: extracted.companyName ?? jd.company ?? null,
    technicalSkills: extracted.technicalSkillsRequired ?? [],
    softSkills: extracted.softSkillsRequired ?? [],
    yearsOfExperience: extracted.yearsOfExperience ?? null,
    responsibilities: extracted.primaryResponsibilities ?? [],
    culture: extracted.companyCulture ?? null,
    likelyTopics: extracted.likelyInterviewTopics ?? [],
    sessionType: session.sessionType,
    overallScore: session.overallScore,
    jobDescriptionId: jd.id,
  };
}

/**
 * Fetches the job description context linked to an interview session.
 * Returns extracted JD data (skills, culture, match info) or null if
 * the session has no linked job description.
 */
export async function getSessionJobMatchData(sessionId: number) {
  const user = await getDbUser();

  const session = await db.query.interviewSessionsTable.findFirst({
    where: and(
      eq(interviewSessionsTable.id, sessionId),
      eq(interviewSessionsTable.userId, user.id)
    ),
    with: {
      jobDescription: true,
    },
  });

  if (!session?.jobDescriptionId || !session.jobDescription) return null;

  const jd = session.jobDescription;
  if (jd.status !== "extracted" || !jd.extractedData) return null;

  const extracted = jd.extractedData as {
    jobTitle?: string;
    companyName?: string | null;
    technicalSkillsRequired?: string[];
    softSkillsRequired?: string[];
    companyCulture?: string | null;
    primaryResponsibilities?: string[];
    yearsOfExperience?: string | null;
  };

  return {
    jobTitle: extracted.jobTitle ?? jd.title ?? "Unknown Role",
    companyName: extracted.companyName ?? jd.company ?? null,
    technicalSkills: extracted.technicalSkillsRequired ?? [],
    softSkills: extracted.softSkillsRequired ?? [],
    culture: extracted.companyCulture ?? null,
    responsibilities: extracted.primaryResponsibilities ?? [],
    yearsOfExperience: extracted.yearsOfExperience ?? null,
    overallScore: session.overallScore,
  };
}
