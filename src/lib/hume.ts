/**
 * Hume.ai Emotion Inference Service
 *
 * Wraps the Hume Node.js SDK (`hume` package, already installed) to provide:
 *   - Batch emotion analysis on audio/video recordings (post-interview processing)
 *   - Real-time streaming emotion analysis WebSocket (during live sessions)
 *   - EVI access token generation (server-side, for browser SDK bootstrap)
 *   - EVI config management and chat history retrieval
 *   - Utility helpers for parsing emotion embedding arrays
 *
 * Env vars required:
 *   HUME_API_KEY               — Hume API key
 *   HUME_SECRET_KEY            — Hume secret key
 *   NEXT_PUBLIC_HUME_CONFIG_ID — Default EVI config ID
 *
 * Hume API reference: https://dev.hume.ai/reference
 */

import "server-only";
import { HumeClient, fetchAccessToken } from "hume";
import type { Hume } from "hume";

// ─── Config ───────────────────────────────────────────────────────────────────

function getClient(): HumeClient {
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error(
      "HUME_API_KEY and HUME_SECRET_KEY must be set in environment variables."
    );
  }
  return new HumeClient({ apiKey, secretKey });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmotionScore {
  /** Hume emotion name (e.g. "Joy", "Anxiety", "Determination") */
  name: string;
  /** Confidence score 0–1 */
  score: number;
}

export interface EmotionSnapshot {
  startTime: number;
  endTime: number;
  emotions: EmotionScore[];
  dominantEmotion: string;
  dominantScore: number;
}

export interface BatchJobStatus {
  jobId: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  createdAt?: number;
  completedAt?: number;
}

export interface BatchProsodyResult {
  jobId: string;
  snapshots: EmotionSnapshot[];
  overallDominantEmotion: string;
  aggregateEmotions: EmotionScore[];
}

export interface StreamConnectionOptions {
  prosody?: boolean;
  language?: boolean;
  face?: boolean;
}

// ─── Access Token ─────────────────────────────────────────────────────────────

/**
 * Generate a short-lived EVI access token for bootstrapping the browser SDK.
 */
export async function getEviAccessToken(configId?: string): Promise<string> {
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;
  const resolvedConfigId =
    configId ?? process.env.NEXT_PUBLIC_HUME_CONFIG_ID;

  if (!apiKey || !secretKey || !resolvedConfigId) {
    throw new Error(
      "Missing HUME_API_KEY, HUME_SECRET_KEY, or NEXT_PUBLIC_HUME_CONFIG_ID."
    );
  }

  const token = await fetchAccessToken({ apiKey, secretKey });
  if (!token || token === "undefined") {
    throw new Error("Hume returned an invalid access token.");
  }
  return token;
}

// ─── Batch emotion analysis ───────────────────────────────────────────────────

/**
 * Submit a batch inference job for prosody (voice emotion) analysis.
 * Returns the Hume job ID — use `pollBatchJob` / `getBatchProsodyResults` async.
 */
export async function startBatchEmotionAnalysis(
  urls: string[],
  options: {
    prosody?: boolean;
    language?: boolean;
    face?: boolean;
  } = {}
): Promise<string> {
  const client = getClient();

  const models: Hume.expressionMeasurement.batch.Models = {
    ...(options.prosody !== false && {
      prosody: {
        granularity: "utterance" as Hume.expressionMeasurement.batch.Granularity,
        window: { length: 4, step: 1 },
      },
    }),
    ...(options.language && { language: {} }),
    ...(options.face && { face: {} }),
  };

  const job = await client.expressionMeasurement.batch.startInferenceJob({
    urls,
    models,
  });

  return job.jobId;
}

/**
 * Poll a batch job until it reaches a terminal state (completed / failed).
 */
export async function pollBatchJob(
  jobId: string,
  timeoutMs = 5 * 60 * 1000,
  pollIntervalMs = 3_000
): Promise<BatchJobStatus> {
  const client = getClient();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const details = await client.expressionMeasurement.batch.getJobDetails(jobId);

    // StateInference is a discriminated union keyed by 'status'
    const rawStatus = (
      details as unknown as { state?: { status?: string } }
    ).state?.status?.toLowerCase() ?? "queued";

    const status = (
      ["queued", "in_progress", "completed", "failed"].includes(rawStatus)
        ? rawStatus
        : "queued"
    ) as BatchJobStatus["status"];

    if (status === "completed" || status === "failed") {
      const state = (details as unknown as { state?: { createdTimestampMs?: number; endedTimestampMs?: number } }).state;
      return {
        jobId,
        status,
        createdAt: state?.createdTimestampMs,
        completedAt: state?.endedTimestampMs,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Hume batch job ${jobId} timed out after ${timeoutMs}ms.`);
}

/**
 * Retrieve and parse prosody emotion predictions from a completed batch job.
 */
export async function getBatchProsodyResults(
  jobId: string
): Promise<BatchProsodyResult> {
  const client = getClient();

  const predictions = await client.expressionMeasurement.batch.getJobPredictions(jobId);

  const snapshots: EmotionSnapshot[] = [];
  const emotionTotals: Record<string, number> = {};
  let emotionCount = 0;

  for (const result of predictions) {
    // Walk the nested prediction structure
    const prosodyPredictions = (
      result as unknown as {
        results?: {
          predictions?: Array<{
            models?: {
              prosody?: {
                predictions?: Array<{
                  time?: { begin?: number; end?: number };
                  emotions?: Array<{ name?: string; score?: number }>;
                }>;
              };
            };
          }>;
        };
      }
    ).results?.predictions ?? [];

    for (const prediction of prosodyPredictions) {
      const prosody = prediction.models?.prosody?.predictions ?? [];

      for (const seg of prosody) {
        const emotions = parseEmotionEmbedding(seg.emotions ?? []);
        if (emotions.length === 0) continue;

        const dominant = emotions[0];
        snapshots.push({
          startTime: seg.time?.begin ?? 0,
          endTime: seg.time?.end ?? 0,
          emotions,
          dominantEmotion: dominant.name,
          dominantScore: dominant.score,
        });

        for (const e of emotions) {
          emotionTotals[e.name] = (emotionTotals[e.name] ?? 0) + e.score;
        }
        emotionCount++;
      }
    }
  }

  const aggregateEmotions: EmotionScore[] = Object.entries(emotionTotals)
    .map(([name, total]) => ({ name, score: total / Math.max(emotionCount, 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    jobId,
    snapshots,
    overallDominantEmotion: aggregateEmotions[0]?.name ?? "Neutral",
    aggregateEmotions,
  };
}

/**
 * Convenience: submit, wait for completion, return results.
 * For short recordings only — long recordings should use the async flow.
 */
export async function analyzeRecordingUrl(
  url: string,
  options: { prosody?: boolean; language?: boolean; face?: boolean } = {}
): Promise<BatchProsodyResult> {
  const jobId = await startBatchEmotionAnalysis([url], options);
  await pollBatchJob(jobId);
  return getBatchProsodyResults(jobId);
}

// ─── Streaming emotion analysis ───────────────────────────────────────────────

/**
 * Create a Hume Expression Measurement streaming WebSocket connection.
 * For real-time emotion detection on audio chunks during active sessions.
 * Designed for use in WebSocket API routes (not Server Actions).
 *
 * Returns the raw socket object. Listen for 'message' events and send
 * base64-encoded audio chunks via `socket.sendAudioInput(base64Audio)`.
 */
export async function createEmotionStream(
  options: StreamConnectionOptions = {}
) {
  const client = getClient();

  const models = {
    ...(options.prosody !== false && { prosody: {} }),
    ...(options.language && { language: {} }),
    ...(options.face && { face: {} }),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client.expressionMeasurement.stream as any).connect({ models });
}

// ─── EVI config & chat management ────────────────────────────────────────────

/**
 * Retrieve a specific EVI config by ID (always fetches latest version = 0).
 */
export async function getEviConfig(configId?: string) {
  const client = getClient();
  const id = configId ?? process.env.NEXT_PUBLIC_HUME_CONFIG_ID;
  if (!id) throw new Error("No configId provided and NEXT_PUBLIC_HUME_CONFIG_ID is not set.");
  return client.empathicVoice.configs.getConfigVersion(id, 0);
}

/**
 * List recent EVI chat sessions.
 * Returns an async iterable Page — collects up to `limit` chats.
 */
export async function listEviChats(limit = 20) {
  const client = getClient();
  const page = await client.empathicVoice.chats.listChats({ pageSize: limit });
  return page;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/**
 * Parse a Hume emotion embedding array into a sorted EmotionScore array.
 */
export function parseEmotionEmbedding(
  embedding: Array<{ name?: string; score?: number }>
): EmotionScore[] {
  return embedding
    .filter((e) => e.name != null && e.score != null)
    .map((e) => ({ name: e.name!, score: e.score! }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Convert an EmotionScore array into the JSONB map stored in
 * `emotion_snapshots.emotions` (Record<emotionName, score>).
 */
export function toEmotionMap(
  emotions: EmotionScore[]
): Record<string, number> {
  return Object.fromEntries(emotions.map((e) => [e.name, e.score]));
}
