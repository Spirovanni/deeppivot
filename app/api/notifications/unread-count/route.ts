/**
 * GET /api/notifications/unread-count — Phase 16.3 (deeppivot-246)
 *
 * Returns the number of unread notifications for the authenticated user.
 * Used by the notification badge in DashboardTopBar to show an accurate
 * count without fetching all notifications on every page load.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { notificationsTable, usersTable } from "@/src/db/schema";
import { eq, and, count } from "drizzle-orm";

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

    const [result] = await db
        .select({ count: count() })
        .from(notificationsTable)
        .where(
            and(
                eq(notificationsTable.userId, user.id),
                eq(notificationsTable.isRead, false)
            )
        );

    return NextResponse.json({ unreadCount: Number(result?.count ?? 0) });
}
