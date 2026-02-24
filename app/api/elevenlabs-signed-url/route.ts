import { getConversationalAISignedUrl } from "@/src/lib/elevenlabs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    console.log('🔑 Fetching ElevenLabs signed URL for agent:', agentId);
    const signedUrl = await getConversationalAISignedUrl(agentId);

    if (!signedUrl) {
      console.error('❌ Failed to get signed URL - URL is null/undefined');
      return NextResponse.json(
        { error: 'Unable to get signed URL' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully generated ElevenLabs signed URL');
    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error('❌ Error fetching ElevenLabs signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signed URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
