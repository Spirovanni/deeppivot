/**
 * Inngest functions for interview post-processing.
 *
 * interview.completed: Fetches recording from Vapi, uploads to Cloudflare R2,
 * saves URL to recording_urls table, then emits recording.processed.
 *
 * recording.processed: Triggers transcription (Deepgram).
 */

import { inngest } from "@/src/inngest/client";
import { db } from "@/src/db";
import {
  recordingUrlsTable,
  transcriptUrlsTable,
  emotionalAnalysesTable,
  interviewFeedbackTable,
  interviewSessionsTable,
} from "@/src/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { getCall } from "@/src/lib/vapi";
import { uploadToR2 } from "@/src/lib/storage";
import { transcribeInterviewRecording } from "@/src/lib/deepgram";
import { generateCompletion } from "@/src/lib/llm";
import { mapInterviewToSkills } from "@/src/lib/career-skills";

export const processInterviewRecording = inngest.createFunction(
  {
    id: "process-interview-recording",
    name: "Process Interview Recording",
    retries: 3,
  },
  { event: "interview.completed" },
  async ({ event, step }) => {
    const { sessionId, callId } = event.data as {
      sessionId: number;
      callId: string;
    };

    if (!sessionId || !callId) {
      throw new Error("Missing sessionId or callId in event data");
    }

    // 1. Fetch recording URL from Vapi (may need retry - Vapi may not have it immediately)
    const call = await step.run("fetch-vapi-call", async () => {
      const c = await getCall(callId);
      if (!c.recordingUrl && !c.stereoRecordingUrl) {
        throw new Error(
          `Vapi call ${callId} has no recording URL yet (may still be processing)`
        );
      }
      return c;
    });

    const recordingUrl = call.recordingUrl ?? call.stereoRecordingUrl;
    if (!recordingUrl) {
      throw new Error("No recording URL available from Vapi");
    }

    // 2. Download recording and upload to Cloudflare R2
    const storageUrl = await step.run("upload-to-r2", async () => {
      const res = await fetch(recordingUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch recording: ${res.status} ${res.statusText}`);
      }
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") ?? "audio/mpeg";
      const ext = contentType.includes("mp3") ? "mp3" : "m4a";
      const key = `recordings/session-${sessionId}-${callId}.${ext}`;

      return uploadToR2(key, Buffer.from(buffer), contentType);
    });

    // 3. Save to recording_urls table
    await step.run("save-recording-url", async () => {
      await db.insert(recordingUrlsTable).values({
        sessionId,
        url: storageUrl,
        source: "vapi",
      });
    });

    // 4. Emit recording.processed for transcription job
    await step.sendEvent("trigger-transcription", {
      name: "recording.processed",
      data: { sessionId, recordingUrl: storageUrl },
    });

    return { sessionId, callId, recordingUrl: storageUrl };
  }
);

export const processInterviewTranscription = inngest.createFunction(
  {
    id: "process-interview-transcription",
    name: "Process Interview Transcription",
    retries: 3,
  },
  { event: "recording.processed" },
  async ({ event, step }) => {
    const { sessionId, recordingUrl } = event.data as {
      sessionId: number;
      recordingUrl: string;
    };

    if (!sessionId || !recordingUrl) {
      throw new Error("Missing sessionId or recordingUrl in event data");
    }

    // 1. Transcribe via Deepgram
    const transcriptResult = await step.run("transcribe-recording", async () => {
      return transcribeInterviewRecording(recordingUrl);
    });

    // 2. Save transcript to Cloudflare R2
    const transcriptFileUrl = await step.run("upload-transcript", async () => {
      const content = JSON.stringify(
        {
          transcript: transcriptResult.transcript,
          confidence: transcriptResult.confidence,
          duration: transcriptResult.duration,
          words: transcriptResult.words,
          utterances: transcriptResult.utterances,
        },
        null,
        2
      );
      const key = `transcripts/session-${sessionId}.json`;
      return uploadToR2(key, content, "application/json");
    });

    // 3. Save to transcript_urls table
    await step.run("save-transcript-url", async () => {
      await db.insert(transcriptUrlsTable).values({
        sessionId,
        url: transcriptFileUrl,
      });
    });

    // 4. Emit for feedback job
    await step.sendEvent("transcription-complete", {
      name: "transcription.complete",
      data: { sessionId },
    });

    return { sessionId, transcriptUrl: transcriptFileUrl };
  }
);

// Emotional analysis disabled (previously used Hume.ai)
// To re-enable: integrate a voice emotion analysis provider and uncomment this function
export const processInterviewEmotionalAnalysis = inngest.createFunction(
  {
    id: "process-interview-emotional-analysis",
    name: "Process Interview Emotional Analysis",
    retries: 3,
  },
  { event: "recording.processed" },
  async ({ event, step }) => {
    const { sessionId } = event.data as {
      sessionId: number;
      recordingUrl: string;
    };

    if (!sessionId) {
      throw new Error("Missing sessionId in event data");
    }

    // Placeholder: Insert fallback emotional analysis (unavailable)
    await step.run("save-emotional-analysis-fallback", async () => {
      await db.insert(emotionalAnalysesTable).values({
        sessionId,
        jobId: "emotional-analysis-disabled",
        data: {
          snapshots: [],
          overallDominantEmotion: "Unknown",
          aggregateEmotions: [],
          unavailable: true,
        },
      });
    });

    // Emit for feedback job to continue pipeline
    await step.sendEvent("emotion-analysis-complete", {
      name: "emotion_analysis.complete",
      data: { sessionId },
    });

    return { sessionId, jobId: "emotional-analysis-disabled" };
  }
);

export const processInterviewFeedback = inngest.createFunction(
  {
    id: "process-interview-feedback",
    name: "Process Interview Feedback",
    retries: 2,
  },
  { event: "recording.processed" },
  async ({ event, step }) => {
    const { sessionId } = event.data as { sessionId: number; recordingUrl: string };

    if (!sessionId) {
      throw new Error("Missing sessionId in event data");
    }

    // 1. Wait for transcription to complete
    await step.waitForEvent("wait-for-transcription", {
      event: "transcription.complete",
      match: "data.sessionId",
      timeout: "1h",
    });

    // 2. Wait for emotion analysis to complete
    await step.waitForEvent("wait-for-emotion-analysis", {
      event: "emotion_analysis.complete",
      match: "data.sessionId",
      timeout: "1h",
    });

    // 3. Fetch transcript, emotion data, and past feedback from DB
    const { transcript, emotionData, pastFeedback } = await step.run("fetch-data", async () => {
      const [transcriptRow] = await db
        .select({ url: transcriptUrlsTable.url })
        .from(transcriptUrlsTable)
        .where(eq(transcriptUrlsTable.sessionId, sessionId))
        .limit(1);

      const [emotionRow] = await db
        .select({ data: emotionalAnalysesTable.data })
        .from(emotionalAnalysesTable)
        .where(eq(emotionalAnalysesTable.sessionId, sessionId))
        .limit(1);

      if (!transcriptRow?.url) {
        throw new Error(`No transcript found for session ${sessionId}`);
      }
      if (!emotionRow?.data) {
        throw new Error(`No emotion analysis found for session ${sessionId}`);
      }

      const res = await fetch(transcriptRow.url);
      if (!res.ok) throw new Error(`Failed to fetch transcript: ${res.status}`);
      const transcriptJson = (await res.json()) as {
        transcript?: string;
        utterances?: Array<{ transcript: string }>;
      };
      const transcript =
        transcriptJson.transcript ??
        transcriptJson.utterances?.map((u) => u.transcript).join(" ") ??
        "";

      const emotionData = emotionRow.data as {
        overallDominantEmotion?: string;
        aggregateEmotions?: Array<{ name: string; score: number }>;
        snapshots?: Array<{ dominantEmotion: string }>;
        unavailable?: boolean;
      };

      // Fetch past feedback for adaptive context (same user, other sessions)
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
            return c.slice(0, 400) + (c.length > 400 ? "…" : "");
          })
          .filter((s) => s.length > 0);
      }

      return { transcript, emotionData, pastFeedback };
    });

    // 4. Generate structured feedback via LLM (adaptive: considers past feedback)
    const feedbackContent = await step.run("generate-feedback", async () => {
      const emotionUnavailable = emotionData.unavailable === true;
      const emotionSummary =
        emotionUnavailable ? "Unavailable" : (emotionData.overallDominantEmotion ?? "Unknown");
      const topEmotions = emotionUnavailable
        ? "N/A"
        : (emotionData.aggregateEmotions?.slice(0, 5).map((e) => `${e.name} (${(e.score * 100).toFixed(0)}%)`).join(", ") ?? "N/A");

      const emotionContext = emotionUnavailable
        ? "Emotional analysis: Unavailable (voice emotion analysis could not be performed)."
        : `Emotional analysis: Dominant emotion: ${emotionSummary}. Top emotions: ${topEmotions}.`;

      const pastFeedbackContext =
        pastFeedback.length > 0
          ? `\n\n---\nPrevious feedback from this candidate's past interviews (use to highlight improvement or recurring issues):\n${pastFeedback.map((f, i) => `[Past ${i + 1}]\n${f}`).join("\n\n")}`
          : "";

      const { content } = await generateCompletion({
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
- Brief summary of how their emotional delivery came across (or note that emotion analysis was unavailable if only transcript was used)

## Overall Recommendation
- 1-2 sentences with next steps.`,
          },
          {
            role: "user",
            content: `Interview transcript:\n\n${transcript}\n\n---\n${emotionContext}${pastFeedbackContext}\n\nGenerate structured feedback.`,
          },
        ],
        maxTokens: 1500,
        temperature: 0.5,
      });

      return content;
    });

    // 5. Map interview performance to career skills (for career plan builder)
    const skillsMapping = await step.run("map-skills", async () => {
      const emotionSummary =
        emotionData.unavailable === true ? "Emotion analysis unavailable" : (emotionData.overallDominantEmotion ?? "Unknown");
      return mapInterviewToSkills(transcript, feedbackContent, emotionSummary);
    });

    // 6. Save to interview_feedback table
    await step.run("save-feedback", async () => {
      await db.insert(interviewFeedbackTable).values({
        sessionId,
        content: feedbackContent,
        skillsMapping: skillsMapping.length > 0 ? skillsMapping : undefined,
      });
    });

    // 7. Emit for career archetyping engine
    await step.sendEvent("trigger-archetyping", {
      name: "feedback.complete",
      data: { sessionId },
    });

    return { sessionId };
  }
);

export const processCareerArchetyping = inngest.createFunction(
  {
    id: "process-career-archetyping",
    name: "Process Career Archetyping",
    retries: 2,
  },
  { event: "feedback.complete" },
  async ({ event, step }) => {
    const { sessionId } = event.data as { sessionId: number };

    if (!sessionId) {
      throw new Error("Missing sessionId in feedback.complete event");
    }

    const result = await step.run("run-archetyping-engine", async () => {
      const { runCareerArchetyping } = await import(
        "@/src/lib/career-archetyping-engine"
      );
      return runCareerArchetyping(sessionId);
    });

    // Post-processing: bias detection (flags imbalances for human review)
    await step.run("bias-check", async () => {
      const { runBiasCheckAndLog } = await import(
        "@/src/lib/archetype-bias-detection"
      );
      await runBiasCheckAndLog();
      return { checked: true };
    });

    return { sessionId, userId: result?.userId, archetypeId: result?.archetypeId };
  }
);
