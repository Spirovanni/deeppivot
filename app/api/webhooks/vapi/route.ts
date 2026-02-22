/**
 * Vapi webhook handler.
 *
 * Receives end-of-call-report and status-update (ended) events.
 * When a call ends, finds the matching interview session and sends
 * an Inngest 'interview.completed' event to trigger recording processing.
 *
 * Configure Vapi Server URL: https://your-domain.com/api/webhooks/vapi
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { interviewSessionsTable } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { inngest } from "@/src/inngest/client";

interface VapiWebhookMessage {
  type: string;
  call?: { id: string };
  status?: string;
}

interface VapiWebhookBody {
  message?: VapiWebhookMessage;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VapiWebhookBody;
    const msg = body?.message;
    if (!msg?.call?.id) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const callId = msg.call.id;
    const isEnded =
      msg.type === "end-of-call-report" ||
      (msg.type === "status-update" && msg.status === "ended");

    if (!isEnded) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Find session with this vapiCallId in notes (stored as JSON: { vapiCallId: "..." })
    const sessions = await db
      .select({ id: interviewSessionsTable.id })
      .from(interviewSessionsTable)
      .where(sql`${interviewSessionsTable.notes}::jsonb->>'vapiCallId' = ${callId}`)
      .limit(1);

    const session = sessions[0];
    if (!session) {
      console.warn(`[vapi webhook] No session found for callId ${callId}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Update session status to completed
    await db
      .update(interviewSessionsTable)
      .set({ status: "completed", endedAt: new Date(), updatedAt: new Date() })
      .where(eq(interviewSessionsTable.id, session.id));

    // Send Inngest event for recording processing
    await inngest.send({
      name: "interview.completed",
      data: { sessionId: session.id, callId },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[vapi webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
