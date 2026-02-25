/**
 * ElevenLabs Conversational AI Integration
 *
 * Provides server-side utilities for ElevenLabs Conversational AI:
 * - Signed URL generation for WebSocket connections
 * - Agent configuration
 *
 * Env vars required:
 *   ELEVENLABS_API_KEY - ElevenLabs API key
 *
 * Reference: https://elevenlabs.io/docs/conversational-ai/overview
 */

import "server-only";
import { ElevenLabsClient } from "elevenlabs";
import type { Llm } from "elevenlabs/api/types";

// ─── Config ───────────────────────────────────────────────────────────────────

function getClient(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY must be set in environment variables.");
  }
  return new ElevenLabsClient({ apiKey });
}

// ─── Conversational AI ────────────────────────────────────────────────────────

/**
 * Generate a signed URL for ElevenLabs Conversational AI WebSocket connection.
 *
 * @param agentId - The agent ID to connect to (from ElevenLabs dashboard)
 * @returns Signed URL valid for WebSocket connection
 */
export async function getConversationalAISignedUrl(
  agentId: string
): Promise<string> {
  const client = getClient();

  try {
    const response = await client.conversationalAi.getSignedUrl({
      agent_id: agentId
    });

    if (!response.signed_url) {
      throw new Error("Failed to get signed URL from ElevenLabs");
    }

    return response.signed_url;
  } catch (error) {
    console.error("Error getting ElevenLabs signed URL:", error);
    throw error;
  }
}

/**
 * List available conversational AI agents
 */
export async function listConversationalAgents() {
  const client = getClient();

  try {
    const agents = await client.conversationalAi.getAgents();
    return agents;
  } catch (error) {
    console.error("Error listing ElevenLabs agents:", error);
    throw error;
  }
}

/**
 * Create a new conversational AI agent
 */
export async function createConversationalAgent(config: {
  name: string;
  systemPrompt: string;
  firstMessage: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}) {
  const client = getClient();

  try {
    const agent = await client.conversationalAi.createAgent({
      conversation_config: {
        agent: {
          prompt: {
            prompt: config.systemPrompt,
            llm: (config.modelId || "gpt-4o") as Llm,
          },
          first_message: config.firstMessage,
        },
        tts: {
          voice_id: config.voiceId,
          stability: config.stability ?? 0.5,
          similarity_boost: config.similarityBoost ?? 0.75,
        },
      },
      platform_settings: {},
    });

    return agent;
  } catch (error) {
    console.error("Error creating ElevenLabs agent:", error);
    throw error;
  }
}
