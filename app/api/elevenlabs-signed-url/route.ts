import { getConversationalAISignedUrl } from "@/src/lib/elevenlabs";
import { resolveAgentConfig } from "@/src/lib/actions/agent-configs";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/src/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "ELEVENLABS_URL");
  if (!rl.success) return rl.response;

  // Pre-flight: check that the ElevenLabs API key is configured
  if (!process.env.ELEVENLABS_API_KEY) {
    console.error("ELEVENLABS_API_KEY is not set in environment variables");
    return NextResponse.json(
      { error: "ElevenLabs API key is not configured. Add ELEVENLABS_API_KEY to your environment variables." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { agentId, interviewType } = body as {
      agentId?: string;
      interviewType?: string;
    };

    // Resolve the effective agent ID:
    // 1. Try to find a user-configured or system-preset agent config for this interview type.
    // 2. Fall back to the agentId supplied by the client (from env var).
    let effectiveAgentId = agentId;

    if (interviewType) {
      try {
        const config = await resolveAgentConfig(interviewType);
        if (config?.elevenLabsAgentId) {
          console.log(
            `Using agent config "${config.name}" (id=${config.id}) for interviewType="${interviewType}"`
          );
          effectiveAgentId = config.elevenLabsAgentId;
        }
      } catch {
        // resolveAgentConfig throws if unauthenticated — fall back silently
        console.warn("Could not resolve agent config, using default agent ID");
      }
    }

    if (!effectiveAgentId) {
      return NextResponse.json(
        { error: "No agent ID available. Configure an agent in the admin panel or set NEXT_PUBLIC_ELEVENLABS_AGENT_ID." },
        { status: 400 }
      );
    }

    console.log("Fetching ElevenLabs signed URL for agent:", effectiveAgentId);
    const signedUrl = await getConversationalAISignedUrl(effectiveAgentId);

    if (!signedUrl) {
      console.error("Failed to get signed URL - URL is null/undefined");
      return NextResponse.json(
        { error: "Unable to get signed URL" },
        { status: 500 }
      );
    }

    console.log("Successfully generated ElevenLabs signed URL");
    return NextResponse.json({ signedUrl, agentId: effectiveAgentId });
  } catch (error) {
    console.error("Error fetching ElevenLabs signed URL:", error);

    // Surface the actual ElevenLabs error for easier debugging
    const message = error instanceof Error ? error.message : "Unknown error";
    const isAuthError = message.includes("401") || message.includes("Unauthorized") || message.includes("authentication");
    const isNotFound = message.includes("404") || message.includes("not found") || message.includes("Not Found");

    let userMessage = `Failed to fetch signed URL: ${message}`;
    if (isAuthError) {
      userMessage = "ElevenLabs API key is invalid or expired. Check your ELEVENLABS_API_KEY environment variable.";
    } else if (isNotFound) {
      userMessage = "ElevenLabs agent not found. Verify the Agent ID exists on your ElevenLabs dashboard.";
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
