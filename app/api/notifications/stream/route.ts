/**
 * GET /api/notifications/stream — Phase 16.3 (deeppivot-244)
 *
 * Server-Sent Events stream for real-time notification updates.
 * Polls the DB every 5 seconds for new notifications; pushes an event when found.
 * Client should refetch /api/notifications on "notifications-changed" events.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable, notificationsTable } from "@/src/db/schema";
import { eq, gt, and, count } from "drizzle-orm";

const POLL_INTERVAL_MS = 5000;

function formatSSE(event: string, data: string, id?: string): string {
    let out = `event: ${event}\ndata: ${data}`;
    if (id != null) out += `\nid: ${id}`;
    return out + "\n\n";
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId))
        .limit(1);

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            let lastCheckedAt = Date.now();
            let interval: ReturnType<typeof setInterval> | null = null;

            const poll = async () => {
                try {
                    const now = Date.now();
                    const since = new Date(lastCheckedAt - POLL_INTERVAL_MS - 1000);

                    const [res] = await db
                        .select({ count: count() })
                        .from(notificationsTable)
                        .where(
                            and(
                                eq(notificationsTable.userId, user.id),
                                gt(notificationsTable.createdAt, since)
                            )
                        );

                    lastCheckedAt = now;

                    const msg =
                        (res?.count ?? 0) > 0
                            ? formatSSE("notifications-changed", JSON.stringify({ at: now }), String(now))
                            : formatSSE("ping", "{}", String(now));
                    try {
                        controller.enqueue(encoder.encode(msg));
                    } catch {
                        if (interval) clearInterval(interval);
                        return;
                    }
                } catch (err) {
                    try {
                        controller.enqueue(
                            encoder.encode(formatSSE("error", JSON.stringify({ error: "poll failed" })))
                        );
                    } catch {
                        if (interval) clearInterval(interval);
                    }
                }
            };

            poll();
            interval = setInterval(poll, POLL_INTERVAL_MS);

            return () => {
                if (interval) clearInterval(interval);
            };
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
