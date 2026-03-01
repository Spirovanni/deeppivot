/**
 * PATCH /api/notifications/read-all — Phase 16.3 (deeppivot-243)
 *
 * Marks all notifications as read for the authenticated user.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { notificationsTable, usersTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH() {
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

    const result = await db
        .update(notificationsTable)
        .set({ isRead: true })
        .where(
            and(
                eq(notificationsTable.userId, user.id),
                eq(notificationsTable.isRead, false)
            )
        )
        .returning();

    return NextResponse.json({
        success: true,
        markedCount: result.length,
    });
}
