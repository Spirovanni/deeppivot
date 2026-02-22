/**
 * Deepgram Speech-to-Text Integration Service
 *
 * Wraps the Deepgram Node.js SDK (@deepgram/sdk v4) to provide:
 *   - Pre-recorded file / URL transcription
 *   - Live streaming transcription connection factory
 *   - Convenience helpers for interview recording post-processing
 *
 * Env vars required:
 *   DEEPGRAM_API_KEY  — Deepgram API key (console.deepgram.com)
 *
 * Deepgram API reference: https://developers.deepgram.com/reference
 */

import "server-only";
import { createClient, type LiveSchema } from "@deepgram/sdk";

// ─── Config ───────────────────────────────────────────────────────────────────

function getClient() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("DEEPGRAM_API_KEY is not set in environment variables.");
  return createClient(key);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptionOptions {
  /** Deepgram model: nova-3 (default), nova-2, enhanced, base */
  model?: string;
  /** BCP-47 language code, e.g. "en-US" */
  language?: string;
  /** Auto-format transcript with punctuation and casing */
  smartFormat?: boolean;
  /** Speaker diarization — label who said what */
  diarize?: boolean;
  /** Split transcript into utterances */
  utterances?: boolean;
  /** Silence threshold for utterance splitting (ms) */
  utteranceEndMs?: number;
  /** Include detected filler words (um, uh, etc.) */
  fillerWords?: boolean;
  /** Detect paragraphs (requires smartFormat) */
  paragraphs?: boolean;
  /** Number of audio channels (default: 1) */
  channels?: number;
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
  speaker?: number;
}

export interface TranscriptUtterance {
  id: string;
  start: number;
  end: number;
  confidence: number;
  channel: number;
  transcript: string;
  words: TranscriptWord[];
  speaker?: number;
}

export interface TranscriptionResult {
  /** Full transcript as a single string */
  transcript: string;
  /** Confidence score 0–1 */
  confidence: number;
  /** Word-level detail with timestamps */
  words: TranscriptWord[];
  /** Utterance-level segments (populated when utterances: true) */
  utterances: TranscriptUtterance[];
  /** Audio duration in seconds */
  duration: number;
  /** Deepgram request ID for debugging */
  requestId: string;
}

export interface LiveTranscriptionOptions extends TranscriptionOptions {
  /** Return in-progress results before utterance is final */
  interimResults?: boolean;
  /** Voice activity detection events */
  vadEvents?: boolean;
  /** Endpointing sensitivity — ms of silence to end utterance */
  endpointing?: number;
  /** Encoding of the audio stream */
  encoding?: string;
  /** Sample rate of the audio stream */
  sampleRate?: number;
}

// ─── Pre-recorded transcription ───────────────────────────────────────────────

/**
 * Transcribe audio from a public URL (e.g. Vapi recording URL).
 */
export async function transcribeUrl(
  url: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const deepgram = getClient();
  const opts = buildPrerecordedOptions(options);

  const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
    { url },
    opts
  );

  if (error) throw new Error(`Deepgram transcription error: ${error.message}`);
  if (!result) throw new Error("Deepgram returned no result.");

  return parseTranscriptionResult(result);
}

/**
 * Transcribe audio from a Buffer (e.g. uploaded file read into memory).
 */
export async function transcribeBuffer(
  audio: Buffer,
  mimeType: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const deepgram = getClient();
  const opts = buildPrerecordedOptions(options);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audio,
    { ...opts, mimetype: mimeType }
  );

  if (error) throw new Error(`Deepgram transcription error: ${error.message}`);
  if (!result) throw new Error("Deepgram returned no result.");

  return parseTranscriptionResult(result);
}

// ─── Live streaming ───────────────────────────────────────────────────────────

/**
 * Create a live streaming transcription connection.
 *
 * Returns a Deepgram LiveClient that emits transcript events in real time.
 * Designed for use in WebSocket API routes (not in Server Actions).
 *
 * @example
 * const connection = createLiveConnection({ model: 'nova-3', language: 'en-US' });
 * connection.on(LiveTranscriptionEvents.Transcript, (data) => {
 *   const text = data.channel.alternatives[0].transcript;
 *   if (data.is_final) broadcast(text);
 * });
 * connection.on(LiveTranscriptionEvents.Open, () => connection.send(audioChunk));
 */
export function createLiveConnection(options: LiveTranscriptionOptions = {}) {
  const deepgram = getClient();

  const schema: LiveSchema = {
    model: options.model ?? "nova-3",
    language: options.language ?? "en-US",
    smart_format: options.smartFormat ?? true,
    diarize: options.diarize ?? false,
    filler_words: options.fillerWords ?? false,
    interim_results: options.interimResults ?? true,
    vad_events: options.vadEvents ?? true,
    endpointing: options.endpointing ?? 300,
    utterance_end_ms: options.utteranceEndMs ?? 1000,
    ...(options.encoding && { encoding: options.encoding }),
    ...(options.sampleRate && { sample_rate: options.sampleRate }),
    ...(options.channels && { channels: options.channels }),
  };

  return deepgram.listen.live(schema);
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Transcribe a Vapi call recording for interview post-processing.
 * Enables speaker diarization and utterance segmentation by default.
 */
export async function transcribeInterviewRecording(
  recordingUrl: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  return transcribeUrl(recordingUrl, {
    model: "nova-3",
    language: "en-US",
    smartFormat: true,
    diarize: true,
    utterances: true,
    utteranceEndMs: 1000,
    paragraphs: true,
    ...options,
  });
}

/**
 * Extract a speaker-labelled transcript from a transcription result.
 * Returns an array of { speaker, text, start, end } segments.
 */
export function extractSpeakerSegments(result: TranscriptionResult): Array<{
  speaker: number;
  text: string;
  start: number;
  end: number;
}> {
  if (result.utterances.length === 0) {
    return [{ speaker: 0, text: result.transcript, start: 0, end: result.duration }];
  }

  return result.utterances.map((u) => ({
    speaker: u.speaker ?? 0,
    text: u.transcript,
    start: u.start,
    end: u.end,
  }));
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildPrerecordedOptions(options: TranscriptionOptions) {
  return {
    model: options.model ?? "nova-3",
    language: options.language ?? "en-US",
    smart_format: options.smartFormat ?? true,
    diarize: options.diarize ?? false,
    utterances: options.utterances ?? false,
    filler_words: options.fillerWords ?? false,
    paragraphs: options.paragraphs ?? false,
    ...(options.utteranceEndMs && { utterance_end_ms: options.utteranceEndMs }),
    ...(options.channels && { channels: options.channels }),
  };
}

function parseTranscriptionResult(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any
): TranscriptionResult {
  const channel = result.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  return {
    transcript: alternative?.transcript ?? "",
    confidence: alternative?.confidence ?? 0,
    words: (alternative?.words ?? []).map(
      (w: {
        word: string;
        start: number;
        end: number;
        confidence: number;
        punctuated_word?: string;
        speaker?: number;
      }) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
        punctuated_word: w.punctuated_word,
        speaker: w.speaker,
      })
    ),
    utterances: (result.results?.utterances ?? []).map(
      (u: {
        id: string;
        start: number;
        end: number;
        confidence: number;
        channel: number;
        transcript: string;
        words: TranscriptWord[];
        speaker?: number;
      }) => ({
        id: u.id,
        start: u.start,
        end: u.end,
        confidence: u.confidence,
        channel: u.channel,
        transcript: u.transcript,
        words: u.words,
        speaker: u.speaker,
      })
    ),
    duration: result.metadata?.duration ?? 0,
    requestId: result.metadata?.request_id ?? "",
  };
}
