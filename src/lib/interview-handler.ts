/**
 * Core Interview Session Handler
 *
 * Orchestrates the real-time interview flow:
 * - Creates interview_sessions row
 * - Starts Vapi web call (Deepgram STT, ElevenLabs/PlayHT TTS)
 * - Recording enabled for post-call Hume emotion analysis
 *
 * The Vapi assistant is configured with:
 * - Transcriber: Deepgram (nova-3) for speech-to-text
 * - Voice: ElevenLabs for agent TTS
 * - Recording: enabled for Hume batch emotion analysis (post-call)
 */

import "server-only";
import { db } from "@/src/db";
import { interviewSessionsTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { startInterviewCall } from "@/src/lib/vapi";

export interface StartInterviewInput {
  userId: number;
  sessionType?: "behavioral" | "technical" | "situational" | "general";
  candidateName?: string;
  maxDurationSeconds?: number;
}

export interface StartInterviewResult {
  sessionId: number;
  callId: string;
  webCallUrl: string;
}

/**
 * Initiate a real-time interview session.
 * Creates DB session, starts Vapi web call with Deepgram STT + TTS, returns join URL.
 */
export async function startInterviewSession(
  input: StartInterviewInput
): Promise<StartInterviewResult> {
  const sessionType = input.sessionType ?? "general";

  const [session] = await db
    .insert(interviewSessionsTable)
    .values({
      userId: input.userId,
      sessionType,
      status: "active",
    })
    .returning({ id: interviewSessionsTable.id });

  if (!session) {
    throw new Error("Failed to create interview session");
  }

  const call = await startInterviewCall({
    interviewType: sessionType,
    candidateName: input.candidateName,
    maxDurationSeconds: input.maxDurationSeconds ?? 1800,
  });

  const callId = call.id;
  const webCallUrl = call.webCallUrl;

  if (!webCallUrl) {
    throw new Error("Vapi did not return webCallUrl");
  }

  await db
    .update(interviewSessionsTable)
    .set({
      notes: JSON.stringify({ vapiCallId: callId }),
      updatedAt: new Date(),
    })
    .where(eq(interviewSessionsTable.id, session.id));

  return {
    sessionId: session.id,
    callId,
    webCallUrl,
  };
}
