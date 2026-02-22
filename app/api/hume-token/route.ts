import { getEviAccessToken } from "@/src/lib/hume";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('🔑 Fetching Hume access token...');
    const accessToken = await getEviAccessToken();
    
    if (!accessToken) {
      console.error('❌ Failed to get access token - token is null/undefined');
      return NextResponse.json(
        { error: 'Unable to get access token' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully generated Hume access token');
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('❌ Error fetching Hume access token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 