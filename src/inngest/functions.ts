/**
 * Inngest functions for interview post-processing.
 *
 * interview.completed: Fetches recording from Vapi, uploads to Supabase,
 * saves URL to recording_urls table, then emits recording.processed.
 *
 * recording.processed: Triggers transcription (Deepgram) and emotional
 * analysis (Hume) in parallel.
 */

import { inngest } from "@/src/inngest/client";
import { db } from "@/src/db";
import {
  recordingUrlsTable,
  transcriptUrlsTable,
  emotionalAnalysesTable,
  interviewFeedbackTable,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getCall } from "@/src/lib/vapi";
import { getSupabaseAdmin, RECORDING_BUCKET } from "@/src/lib/supabase";
import { transcribeInterviewRecording } from "@/src/lib/deepgram";
import { analyzeRecordingUrl } from "@/src/lib/hume";
import { generateCompletion } from "@/src/lib/llm";

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

    // 2. Download recording and upload to Supabase
    const supabaseUrl = await step.run("upload-to-supabase", async () => {
      const res = await fetch(recordingUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch recording: ${res.status} ${res.statusText}`);
      }
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") ?? "audio/mpeg";
      const ext = contentType.includes("mp3") ? "mp3" : "m4a";
      const fileName = `session-${sessionId}-${callId}.${ext}`;

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.storage
        .from(RECORDING_BUCKET)
        .upload(fileName, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(RECORDING_BUCKET)
        .getPublicUrl(data.path);
      return urlData.publicUrl;
    });

    // 3. Save to recording_urls table
    await step.run("save-recording-url", async () => {
      await db.insert(recordingUrlsTable).values({
        sessionId,
        url: supabaseUrl,
        source: "vapi",
      });
    });

    // 4. Emit recording.processed for transcription job
    await step.sendEvent("trigger-transcription", {
      name: "recording.processed",
      data: { sessionId, recordingUrl: supabaseUrl },
    });

    return { sessionId, callId, recordingUrl: supabaseUrl };
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

    // 2. Save transcript to Supabase Storage
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
      const fileName = `transcripts/session-${sessionId}.json`;

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.storage
        .from(RECORDING_BUCKET)
        .upload(fileName, content, {
          contentType: "application/json",
          upsert: true,
        });

      if (error) {
        throw new Error(`Supabase transcript upload failed: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(RECORDING_BUCKET)
        .getPublicUrl(data.path);
      return urlData.publicUrl;
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

export const processInterviewEmotionalAnalysis = inngest.createFunction(
  {
    id: "process-interview-emotional-analysis",
    name: "Process Interview Emotional Analysis",
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

    // 1. Submit to Hume batch API, wait for completion, get results
    const result = await step.run("analyze-hume-prosody", async () => {
      return analyzeRecordingUrl(recordingUrl, { prosody: true });
    });

    // 2. Save to emotional_analysis table
    await step.run("save-emotional-analysis", async () => {
      await db.insert(emotionalAnalysesTable).values({
        sessionId,
        jobId: result.jobId,
        data: {
          snapshots: result.snapshots,
          overallDominantEmotion: result.overallDominantEmotion,
          aggregateEmotions: result.aggregateEmotions,
        },
      });
    });

    // 3. Emit for feedback job
    await step.sendEvent("emotion-analysis-complete", {
      name: "emotion_analysis.complete",
      data: { sessionId },
    });

    return { sessionId, jobId: result.jobId };
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

    // 3. Fetch transcript and emotion data from DB
    const { transcript, emotionData } = await step.run("fetch-data", async () => {
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
      };

      return { transcript, emotionData };
    });

    // 4. Generate structured feedback via LLM
    const feedbackContent = await step.run("generate-feedback", async () => {
      const emotionSummary =
        emotionData.overallDominantEmotion ?? "Unknown";
      const topEmotions =
        emotionData.aggregateEmotions?.slice(0, 5).map((e) => `${e.name} (${(e.score * 100).toFixed(0)}%)`).join(", ") ?? "N/A";

      const { content } = await generateCompletion({
        messages: [
          {
            role: "system",
            content: `You are an expert interview coach. Generate structured, actionable feedback for a job interview practice session. 
Output format:
## Strengths
- Bullet points of what the candidate did well

## Areas for Improvement
- Bullet points of specific, actionable suggestions

## Emotional Tone
- Brief summary of how their emotional delivery came across

## Overall Recommendation
- 1-2 sentences with next steps.`,
          },
          {
            role: "user",
            content: `Interview transcript:\n\n${transcript}\n\n---\nEmotional analysis: Dominant emotion: ${emotionSummary}. Top emotions: ${topEmotions}.\n\nGenerate structured feedback.`,
          },
        ],
        maxTokens: 1500,
        temperature: 0.5,
      });

      return content;
    });

    // 5. Save to interview_feedback table
    await step.run("save-feedback", async () => {
      await db.insert(interviewFeedbackTable).values({
        sessionId,
        content: feedbackContent,
      });
    });

    return { sessionId };
  }
);
