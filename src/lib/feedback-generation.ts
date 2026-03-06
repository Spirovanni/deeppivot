/**
 * Shared feedback generation logic for ElevenLabs (and fallback) sessions.
 * Used by Inngest jobs and on-demand Regenerate button.
 * No auth — callers must verify session ownership when needed.
 */

import "server-only";
import { db } from "@/src/db";
import {
  interviewSessionsTable,
  interviewFeedbackTable,
  emotionalAnalysesTable,
  transcriptUrlsTable,
  sessionTranscriptsTable,
  usersTable,
} from "@/src/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { generateCompletion } from "@/src/lib/llm";
import { anonymize } from "@/src/lib/pii";
import { mapInterviewToSkills } from "@/src/lib/career-skills";

const PLACEHOLDER_MESSAGES: Array<{ role: string; text: string }> = [
  {
    role: "user",
    text: "[Session ended before transcript was captured. This can happen with very short sessions or if the connection closed early.]",
  },
  {
    role: "assistant",
    text: "[No interviewer responses were recorded. For best feedback next time, have a full conversation with several question-answer exchanges.]",
  },
];

/**
 * Fetch transcript for a session from transcript_urls (Vapi) or session_transcripts (ElevenLabs).
 */
async function fetchTranscriptMessages(
  sessionId: number
): Promise<Array<{ role: string; text: string }>> {
  const [transcriptRow] = await db
    .select({ url: transcriptUrlsTable.url })
    .from(transcriptUrlsTable)
    .where(eq(transcriptUrlsTable.sessionId, sessionId))
    .limit(1);

  if (transcriptRow?.url) {
    try {
      const res = await fetch(transcriptRow.url);
      if (res.ok) {
        const json = (await res.json()) as {
          transcript?: string;
          utterances?: Array<{ transcript: string; speaker?: number; channel?: number }>;
        };
        if (json.utterances?.length) {
          return json.utterances.map((u) => ({
            role: (u.channel === 0 || u.speaker === 0 ? "user" : "assistant") as string,
            text: u.transcript ?? "",
          }));
        }
        if (json.transcript && json.transcript.length >= 20) {
          return [{ role: "user", text: json.transcript }];
        }
      }
    } catch {
      // Fall through to session_transcripts
    }
  }

  try {
    const [row] = await db
      .select({ messages: sessionTranscriptsTable.messages })
      .from(sessionTranscriptsTable)
      .where(eq(sessionTranscriptsTable.sessionId, sessionId))
      .limit(1);
    const messages = row?.messages;
    if (Array.isArray(messages) && messages.length > 0) {
      return messages as Array<{ role: string; text: string }>;
    }
  } catch {
    // Table may not exist
  }

  return [];
}

/**
 * Generate AI feedback for a completed interview session.
 * Fetches transcript from DB (session_transcripts or transcript_urls), calls LLM, saves to interview_feedback.
 * Idempotent: returns early if feedback already exists.
 *
 * @returns The created feedback row or null (if already exists, skipped, or error)
 */
export async function runFeedbackGenerationForSession(
  sessionId: number
): Promise<{ id: number; content: string | null } | null> {
  const [existing] = await db
    .select({ id: interviewFeedbackTable.id })
    .from(interviewFeedbackTable)
    .where(eq(interviewFeedbackTable.sessionId, sessionId))
    .limit(1);
  if (existing) return null;

  const [session] = await db
    .select({ id: interviewSessionsTable.id, status: interviewSessionsTable.status })
    .from(interviewSessionsTable)
    .where(eq(interviewSessionsTable.id, sessionId))
    .limit(1);

  if (!session || session.status !== "completed") return null;

  let messages = await fetchTranscriptMessages(sessionId);
  if (
    messages.length === 0 ||
    messages.map((m) => m.text).join(" ").trim().length < 20
  ) {
    messages = PLACEHOLDER_MESSAGES;
  }

  const transcriptText = messages
    .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.text}`)
    .join("\n");

  if (transcriptText.trim().length < 20) return null;

  // Insert fallback emotional analysis only if none exists
  const [existingEmotion] = await db
    .select({ id: emotionalAnalysesTable.id })
    .from(emotionalAnalysesTable)
    .where(eq(emotionalAnalysesTable.sessionId, sessionId))
    .limit(1);
  if (!existingEmotion) {
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
  }

  // Fetch user details for adaptive context and PII exclusions
  const [userRow] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName
    })
    .from(usersTable)
    .innerJoin(interviewSessionsTable, eq(interviewSessionsTable.userId, usersTable.id))
    .where(eq(interviewSessionsTable.id, sessionId))
    .limit(1);

  const candidateName = userRow?.name || `${userRow?.firstName} ${userRow?.lastName}`.trim() || "Candidate";
  const exclusions = [candidateName, userRow?.firstName, userRow?.lastName].filter((n): n is string => !!n && n !== "Candidate");

  let pastFeedback: string[] = [];
  if (userRow?.id) {
    const pastRows = await db
      .select({ content: interviewFeedbackTable.content })
      .from(interviewFeedbackTable)
      .innerJoin(
        interviewSessionsTable,
        eq(interviewSessionsTable.id, interviewFeedbackTable.sessionId)
      )
      .where(
        and(
          eq(interviewSessionsTable.userId, userRow.id),
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
# [${candidateName}]

## Strengths
- Bullet points of what the candidate did well

## Areas for Improvement
- Bullet points of specific, actionable suggestions

## Emotional Tone
- Brief summary of how their delivery came across based on their word choice and conversation flow (note that voice emotion analysis was not available)

## Overall Recommendation
- 1-2 sentences with next steps.
 
- IMPORTANT: Use the candidate's actual name (${candidateName}) in the feedback text.
- IMPORTANT: Do NOT use placeholders like "[NAME]" or "[Candidate]". If you see "[NAME]" in past feedback, replace it with "${candidateName}" if referring to the candidate.`,
      },
      {
        role: "user",
        content: `Interview transcript:\n\n${transcriptText}\n\n---\nEmotional analysis: Unavailable (voice emotion analysis was not performed for this session).${pastFeedbackContext}\n\nGenerate structured feedback.`,
      },
    ],
    maxTokens: 1500,
    temperature: 0.5,
  });

  const anonymizedFeedback = anonymize(feedbackContent, exclusions);
  const skillsMapping = await mapInterviewToSkills(
    transcriptText,
    feedbackContent,
    "Emotion analysis unavailable"
  ).catch(() => []);

  const [inserted] = await db
    .insert(interviewFeedbackTable)
    .values({
      sessionId,
      content: anonymizedFeedback,
      skillsMapping: skillsMapping.length > 0 ? skillsMapping : undefined,
    })
    .returning();

  return inserted ? { id: inserted.id, content: inserted.content } : null;
}
