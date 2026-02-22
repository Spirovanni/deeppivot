import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { startInterviewSession } from "@/src/lib/interview-handler";

/**
 * POST /api/interview/start
 *
 * Initiates a real-time AI interview session.
 * Uses Vapi to manage the call, Deepgram for STT, ElevenLabs for TTS.
 * Recording is enabled for post-call Hume emotion analysis.
 *
 * Body: { sessionType?, candidateName?, maxDurationSeconds? }
 * Returns: { sessionId, callId, webCallUrl }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - sign in required" },
        { status: 401 }
      );
    }

    const [dbUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const sessionType = body.sessionType ?? "general";
    const candidateName = body.candidateName;
    const maxDurationSeconds = body.maxDurationSeconds;

    const result = await startInterviewSession({
      userId: dbUser.id,
      sessionType,
      candidateName,
      maxDurationSeconds,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error starting interview:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to start interview", details: message },
      { status: 500 }
    );
  }
}
