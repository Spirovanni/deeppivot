/**
 * TTS (Text-to-Speech) Integration Service
 *
 * Abstracts ElevenLabs and PlayHT behind a common interface for generating speech from text.
 * API keys are read from environment variables.
 *
 * Env vars:
 *   ELEVENLABS_API_KEY  — ElevenLabs API key (required for provider "elevenlabs")
 *   PLAYHT_API_KEY      — PlayHT API key (required for provider "playht")
 *   PLAYHT_USER_ID      — PlayHT user ID (required for provider "playht")
 *   TTS_PROVIDER        — Optional: "elevenlabs" | "playht" | "auto" (default: "auto")
 *
 * Usage:
 *   const result = await generateSpeech("Hello world");
 *   if (result.audioUrl) { /* use URL *\/ }
 *   if (result.audioStream) { /* pipe to response or file *\/ }
 */

import "server-only";
import type { Readable } from "stream";
import { ElevenLabsClient } from "elevenlabs";
import * as PlayHT from "playht";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TTSProvider = "elevenlabs" | "playht" | "auto";

export interface TTSOptions {
  /** Voice ID (provider-specific). Defaults vary by provider. */
  voiceId?: string;
  /** Output format: mp3, etc. Provider-specific. */
  outputFormat?: string;
  /** Model ID (ElevenLabs) or voice engine (PlayHT). */
  modelId?: string;
}

export interface TTSResult {
  /** URL to the generated audio (PlayHT returns this directly). */
  audioUrl?: string;
  /** Readable stream of audio bytes (ElevenLabs returns this). */
  audioStream?: Readable;
  /** Provider that was used. */
  provider: TTSProvider;
}

// ─── Config ───────────────────────────────────────────────────────────────────

function getProvider(): Exclude<TTSProvider, "auto"> {
  const env = process.env.TTS_PROVIDER?.toLowerCase();
  if (env === "elevenlabs" || env === "playht") return env;

  const hasEleven = !!process.env.ELEVENLABS_API_KEY;
  const hasPlayht =
    !!process.env.PLAYHT_API_KEY && !!process.env.PLAYHT_USER_ID;

  if (hasEleven && hasPlayht) return "elevenlabs"; // prefer ElevenLabs when both set
  if (hasEleven) return "elevenlabs";
  if (hasPlayht) return "playht";

  throw new Error(
    "TTS: Set ELEVENLABS_API_KEY or (PLAYHT_API_KEY + PLAYHT_USER_ID) in environment."
  );
}

function ensurePlayHTInit(): void {
  const apiKey = process.env.PLAYHT_API_KEY;
  const userId = process.env.PLAYHT_USER_ID;
  if (!apiKey || !userId) {
    throw new Error("PLAYHT_API_KEY and PLAYHT_USER_ID must be set.");
  }
  PlayHT.init({ apiKey, userId });
}

// ─── ElevenLabs ───────────────────────────────────────────────────────────────

async function generateWithElevenLabs(
  text: string,
  opts?: TTSOptions
): Promise<TTSResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY must be set for ElevenLabs TTS.");
  }

  const client = new ElevenLabsClient({ apiKey });
  const voiceId =
    opts?.voiceId ?? process.env.ELEVENLABS_DEFAULT_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

  const stream = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: opts?.modelId ?? "eleven_multilingual_v2",
  });

  return {
    audioStream: stream,
    provider: "elevenlabs",
  };
}

// ─── PlayHT ────────────────────────────────────────────────────────────────────

async function generateWithPlayHT(
  text: string,
  opts?: TTSOptions
): Promise<TTSResult> {
  ensurePlayHTInit();

  const output = await PlayHT.generate(text, {
    voiceId: opts?.voiceId ?? process.env.PLAYHT_DEFAULT_VOICE_ID,
    voiceEngine: "PlayHT2.0",
  });

  return {
    audioUrl: output.audioUrl,
    provider: "playht",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate speech from text using the configured TTS provider.
 * Returns either an audio URL (PlayHT) or a readable stream (ElevenLabs).
 */
export async function generateSpeech(
  text: string,
  options?: TTSOptions & { provider?: TTSProvider }
): Promise<TTSResult> {
  const provider =
    options?.provider === "auto" || !options?.provider
      ? getProvider()
      : options.provider;

  if (provider === "elevenlabs") {
    return generateWithElevenLabs(text, options);
  }
  if (provider === "playht") {
    return generateWithPlayHT(text, options);
  }

  throw new Error(`Unknown TTS provider: ${provider}`);
}

/**
 * Stream speech from text. Returns a readable stream.
 * For ElevenLabs: native stream. For PlayHT: fetches URL and streams response.
 */
export async function streamSpeech(
  text: string,
  options?: TTSOptions & { provider?: TTSProvider }
): Promise<Readable> {
  const result = await generateSpeech(text, options);

  if (result.audioStream) {
    return result.audioStream;
  }

  if (result.audioUrl) {
    const res = await fetch(result.audioUrl);
    if (!res.body) throw new Error("PlayHT: No response body");
    return res.body as unknown as Readable;
  }

  throw new Error("TTS: No audio stream or URL returned.");
}

/**
 * List available voices (provider-specific).
 * Returns a simplified list for the given provider.
 */
export async function listVoices(
  provider?: Exclude<TTSProvider, "auto">
): Promise<Array<{ id: string; name: string }>> {
  const p = provider ?? getProvider();

  if (p === "playht") {
    ensurePlayHTInit();
    const voices = await PlayHT.listVoices();
    return voices.map((v) => ({ id: v.id, name: v.name }));
  }

  if (p === "elevenlabs") {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY required.");
    const client = new ElevenLabsClient({ apiKey });
    const { voices } = await client.voices.getAll();
    return voices.map((v) => ({ id: v.voice_id, name: v.name ?? v.voice_id }));
  }

  throw new Error(`Unknown provider: ${p}`);
}
