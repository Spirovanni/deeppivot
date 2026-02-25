import { listConversationalAgents } from "@/src/lib/elevenlabs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching agent info for:', agentId);

    // Get all agents and find the one we're using
    const agents = await listConversationalAgents();
    console.log('📋 Available agents:', agents);

    const agent = Array.isArray(agents)
      ? agents.find((a: any) => a.agent_id === agentId)
      : null;

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found', availableAgents: agents },
        { status: 404 }
      );
    }

    console.log('✅ Agent found:', agent);

    return NextResponse.json({
      agent,
      note: "Check the conversation_config and platform_settings for transcription settings"
    });
  } catch (error) {
    console.error('❌ Error fetching agent info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
