import { getConversationalAISignedUrl } from "@/src/lib/elevenlabs";
import { resolveAgentConfig } from "@/src/lib/actions/agent-configs";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/src/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "ELEVENLABS_URL");
  if (!rl.success) return rl.response;

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
            `🎯 Using agent config "${config.name}" (id=${config.id}) for interviewType="${interviewType}"`
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
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    console.log("🔑 Fetching ElevenLabs signed URL for agent:", effectiveAgentId);
    const signedUrl = await getConversationalAISignedUrl(effectiveAgentId);

    if (!signedUrl) {
      console.error("❌ Failed to get signed URL - URL is null/undefined");
      return NextResponse.json(
        { error: "Unable to get signed URL" },
        { status: 500 }
      );
    }

    console.log("✅ Successfully generated ElevenLabs signed URL");
    return NextResponse.json({ signedUrl, agentId: effectiveAgentId });
  } catch (error) {
    console.error("❌ Error fetching ElevenLabs signed URL:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch signed URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
