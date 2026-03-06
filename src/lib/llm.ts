/**
 * LLM Orchestration Service
 *
 * Routes requests to GPT-4 Turbo (OpenAI) or Claude-3 Opus (Anthropic) based on input parameters.
 * API keys are read from environment variables.
 *
 * Env vars:
 *   OPENAI_API_KEY    — OpenAI API key (required for provider "openai")
 *   ANTHROPIC_API_KEY — Anthropic API key (required for provider "anthropic")
 *   LLM_PROVIDER      — Optional: "openai" | "anthropic" | "auto" (default: "auto")
 *
 * Usage:
 *   const { content, provider } = await generateCompletion({ messages: [{ role: "user", content: "Hello" }] });
 */

import "server-only";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LLMProvider = "openai" | "anthropic" | "auto";

export type LLMMessageRole = "user" | "assistant" | "system";

export interface LLMMessage {
  role: LLMMessageRole;
  content: string;
}

export interface LLMCompletionOptions {
  /** Messages to send. System message is supported for both providers. */
  messages: LLMMessage[];
  /** Max tokens to generate. Default: 1024 */
  maxTokens?: number;
  /** Temperature 0–2. Default: 0.7 */
  temperature?: number;
  /** Force a specific provider. Default: "auto" */
  provider?: LLMProvider;
}

export interface LLMCompletionResult {
  /** Generated text content. */
  content: string;
  /** Provider that was used. */
  provider: Exclude<LLMProvider, "auto">;
  /** Token usage if available. */
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const OPENAI_MODEL = "gpt-4o";
const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";

function getProvider(): Exclude<LLMProvider, "auto"> {
  const env = process.env.LLM_PROVIDER?.toLowerCase();
  if (env === "openai" || env === "anthropic") return env;

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (hasOpenAI && hasAnthropic) return "anthropic"; // prefer Anthropic when both set
  if (hasOpenAI) return "openai";
  if (hasAnthropic) return "anthropic";

  throw new Error(
    "LLM: Set OPENAI_API_KEY or ANTHROPIC_API_KEY in environment."
  );
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function completeWithOpenAI(
  messages: LLMMessage[],
  opts: { maxTokens?: number; temperature?: number }
): Promise<LLMCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY must be set for OpenAI LLM.");
  }

  const client = new OpenAI({ apiKey });

  const openaiMessages = messages.map((m) => {
    if (m.role === "system") {
      return { role: "system" as const, content: m.content };
    }
    return {
      role: m.role as "user" | "assistant",
      content: m.content,
    };
  });

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: openaiMessages,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
  });

  const choice = completion.choices[0];
  const content = choice?.message?.content ?? "";
  const usage = completion.usage
    ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens ?? 0,
      }
    : undefined;

  return {
    content,
    provider: "openai",
    usage,
  };
}

// ─── Anthropic ──────────────────────────────────────────────────────────────

async function completeWithAnthropic(
  messages: LLMMessage[],
  opts: { maxTokens?: number; temperature?: number }
): Promise<LLMCompletionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY must be set for Anthropic LLM.");
  }

  const client = new Anthropic({ apiKey });

  const systemMessage = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const anthropicMessages = chatMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    system: systemMessage?.content,
    messages: anthropicMessages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const content =
    textBlock && "text" in textBlock ? textBlock.text : "";
  const usage = response.usage
    ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens:
          response.usage.input_tokens + response.usage.output_tokens,
      }
    : undefined;

  return {
    content,
    provider: "anthropic",
    usage,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a completion from the configured LLM provider.
 * Routes to GPT-4 Turbo (OpenAI) or Claude-3 (Anthropic) based on options or env.
 */
export async function generateCompletion(
  options: LLMCompletionOptions
): Promise<LLMCompletionResult> {
  const provider =
    options.provider === "auto" || !options.provider
      ? getProvider()
      : options.provider;

  const opts = {
    maxTokens: options.maxTokens,
    temperature: options.temperature,
  };

  if (provider === "openai") {
    return completeWithOpenAI(options.messages, opts);
  }
  if (provider === "anthropic") {
    return completeWithAnthropic(options.messages, opts);
  }

  throw new Error(`Unknown LLM provider: ${provider}`);
}
