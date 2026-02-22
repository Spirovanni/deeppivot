/**
 * Inngest functions for interview post-processing.
 *
 * interview.completed: Fetches recording from Vapi, uploads to Supabase,
 * saves URL to recording_urls table, then emits recording.processed.
 *
 * recording.processed: Transcribes via Deepgram, saves transcript to
 * Supabase Storage, links in transcript_urls table.
 */

import { inngest } from "@/src/inngest/client";
import { db } from "@/src/db";
import { recordingUrlsTable, transcriptUrlsTable } from "@/src/db/schema";
import { getCall } from "@/src/lib/vapi";
import { getSupabaseAdmin, RECORDING_BUCKET } from "@/src/lib/supabase";
import { transcribeInterviewRecording } from "@/src/lib/deepgram";

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

    return { sessionId, transcriptUrl: transcriptFileUrl };
  }
);
