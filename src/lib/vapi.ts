/**
 * Vapi Integration Service
 *
 * Encapsulates all Vapi REST API calls. Uses the VAPI_API_KEY environment
 * variable for authentication. All functions are server-side only.
 *
 * Env vars required:
 *   VAPI_API_KEY          — Vapi private API key (from dashboard.vapi.ai)
 *   VAPI_PHONE_NUMBER_ID  — (optional) Default outbound phone number ID
 *
 * Vapi API reference: https://docs.vapi.ai/api-reference
 */

import "server-only";

// ─── Config ───────────────────────────────────────────────────────────────────

const VAPI_BASE_URL = "https://api.vapi.ai";

function getApiKey(): string {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error("VAPI_API_KEY is not set in environment variables.");
  return key;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type VapiCallStatus =
  | "queued"
  | "ringing"
  | "in-progress"
  | "forwarding"
  | "ended";

export type VapiCallType =
  | "webCall"
  | "outboundPhoneCall"
  | "inboundPhoneCall";

export interface VapiCall {
  id: string;
  type: VapiCallType;
  status: VapiCallStatus;
  assistantId: string;
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  summary?: string;
  cost?: number;
  costBreakdown?: Record<string, number>;
  messages?: VapiMessage[];
  analysis?: {
    summary?: string;
    structuredData?: Record<string, unknown>;
    successEvaluation?: string;
  };
}

export interface VapiMessage {
  role: "assistant" | "user" | "tool_call" | "tool_result";
  message?: string;
  time: number;
  endTime?: number;
  secondsFromStart: number;
}

export interface VapiAssistant {
  id: string;
  name: string;
  model: Record<string, unknown>;
  voice: Record<string, unknown>;
  firstMessage?: string;
  maxDurationSeconds?: number;
  recordingEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface TranscriberOverrides {
  provider: "deepgram";
  model?: string;
  language?: string;
  smartFormat?: boolean;
}

export interface VoiceOverrides {
  provider: "elevenlabs" | "deepgram" | "playht";
  voiceId: string;
  speed?: number;
}

export interface AssistantOverrides {
  firstMessage?: string;
  maxDurationSeconds?: number;
  recordingEnabled?: boolean;
  hipaaEnabled?: boolean;
  transcriber?: TranscriberOverrides;
  voice?: VoiceOverrides;
  model?: {
    provider: string;
    model: string;
    systemPrompt?: string;
    temperature?: number;
  };
  metadata?: Record<string, string>;
}

export interface CreateWebCallOptions {
  /** ID of the Vapi assistant to use for this call */
  assistantId: string;
  /** Per-call overrides applied on top of the assistant config */
  assistantOverrides?: AssistantOverrides;
  /** Arbitrary key-value metadata stored against the call */
  metadata?: Record<string, string>;
}

export interface CreatePhoneCallOptions {
  assistantId: string;
  customer: {
    /** E.164 format e.g. +14155551234 */
    number: string;
    name?: string;
  };
  /** Vapi phone number ID to call from (defaults to VAPI_PHONE_NUMBER_ID env var) */
  phoneNumberId?: string;
  assistantOverrides?: AssistantOverrides;
  metadata?: Record<string, string>;
}

export interface CreateAssistantOptions {
  name: string;
  model?: {
    provider: "openai" | "anthropic" | "google" | "groq" | "custom-llm";
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  };
  voice?: {
    provider: "elevenlabs" | "deepgram" | "openai" | "azure" | "neets";
    voiceId: string;
    speed?: number;
  };
  firstMessage?: string;
  maxDurationSeconds?: number;
  recordingEnabled?: boolean;
  endCallMessage?: string;
  endCallPhrases?: string[];
  metadata?: Record<string, string>;
}

export interface ListCallsOptions {
  limit?: number;
  createdAtGt?: string;
  createdAtLt?: string;
  assistantId?: string;
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function vapiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${VAPI_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    let message: string;
    try {
      const err = (await response.json()) as { message?: string };
      message = err.message ?? response.statusText;
    } catch {
      message = response.statusText;
    }
    throw new Error(`Vapi API error [${response.status}]: ${message}`);
  }

  // DELETE returns 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ─── Call management ──────────────────────────────────────────────────────────

/**
 * Start a web (browser) call session. Returns the call object including the
 * `webCallUrl` needed by the browser SDK to join.
 */
export async function createWebCall(
  options: CreateWebCallOptions
): Promise<VapiCall & { webCallUrl?: string }> {
  return vapiRequest("POST", "/call/web", options);
}

/**
 * Initiate an outbound phone call to a customer's number.
 */
export async function createPhoneCall(
  options: CreatePhoneCallOptions
): Promise<VapiCall> {
  const payload = {
    ...options,
    phoneNumberId:
      options.phoneNumberId ?? process.env.VAPI_PHONE_NUMBER_ID,
  };
  return vapiRequest("POST", "/call/phone", payload);
}

/**
 * Retrieve a specific call by ID.
 */
export async function getCall(callId: string): Promise<VapiCall> {
  return vapiRequest("GET", `/call/${callId}`);
}

/**
 * List calls with optional filters.
 */
export async function listCalls(
  options: ListCallsOptions = {}
): Promise<VapiCall[]> {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.createdAtGt) params.set("createdAtGt", options.createdAtGt);
  if (options.createdAtLt) params.set("createdAtLt", options.createdAtLt);
  if (options.assistantId) params.set("assistantId", options.assistantId);

  const query = params.toString();
  return vapiRequest("GET", `/call${query ? `?${query}` : ""}`);
}

/**
 * End an active call. Returns the updated call object.
 */
export async function endCall(callId: string): Promise<VapiCall> {
  return vapiRequest("DELETE", `/call/${callId}`);
}

// ─── Assistant management ─────────────────────────────────────────────────────

/**
 * Create a new Vapi assistant with the given configuration.
 */
export async function createAssistant(
  options: CreateAssistantOptions
): Promise<VapiAssistant> {
  return vapiRequest("POST", "/assistant", options);
}

/**
 * Retrieve an assistant by ID.
 */
export async function getAssistant(assistantId: string): Promise<VapiAssistant> {
  return vapiRequest("GET", `/assistant/${assistantId}`);
}

/**
 * Update an existing assistant. Only supplied fields are changed.
 */
export async function updateAssistant(
  assistantId: string,
  updates: Partial<CreateAssistantOptions>
): Promise<VapiAssistant> {
  return vapiRequest("PATCH", `/assistant/${assistantId}`, updates);
}

/**
 * List all assistants for the account.
 */
export async function listAssistants(): Promise<VapiAssistant[]> {
  return vapiRequest("GET", "/assistant");
}

// ─── Convenience: Interview session helpers ───────────────────────────────────

/**
 * Start a DeepPivot interview web call.
 * Uses the default interview assistant configured via VAPI_INTERVIEW_ASSISTANT_ID.
 */
export async function startInterviewCall(options: {
  assistantId?: string;
  interviewType?: "behavioral" | "technical" | "situational" | "general";
  candidateName?: string;
  maxDurationSeconds?: number;
}): Promise<VapiCall & { webCallUrl?: string }> {
  const assistantId =
    options.assistantId ?? process.env.VAPI_INTERVIEW_ASSISTANT_ID;

  if (!assistantId) {
    throw new Error(
      "No assistantId provided and VAPI_INTERVIEW_ASSISTANT_ID is not set."
    );
  }

  const voiceId =
    process.env.ELEVENLABS_DEFAULT_VOICE_ID ??
    process.env.VAPI_DEFAULT_VOICE_ID ??
    "21m00Tcm4TlvDq8ikWAM";

  return createWebCall({
    assistantId,
    assistantOverrides: {
      maxDurationSeconds: options.maxDurationSeconds ?? 1800, // 30 min default
      recordingEnabled: true,
      transcriber: {
        provider: "deepgram",
        model: "nova-3",
        language: "en-US",
        smartFormat: true,
      },
      voice: {
        provider: "elevenlabs",
        voiceId,
      },
      firstMessage: options.candidateName
        ? `Hello ${options.candidateName}! I'm your AI interviewer today. We'll be doing a ${options.interviewType ?? "general"} interview. Are you ready to begin?`
        : `Hello! I'm your AI interviewer. We'll be doing a ${options.interviewType ?? "general"} interview. Are you ready to begin?`,
      metadata: {
        interviewType: options.interviewType ?? "general",
        ...(options.candidateName && { candidateName: options.candidateName }),
      },
    },
    metadata: {
      source: "deeppivot",
      interviewType: options.interviewType ?? "general",
    },
  });
}
