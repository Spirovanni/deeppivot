/**
 * PATCH /api/notifications/[id]/read — Phase 16.3 (deeppivot-242)
 *
 * Marks a notification as read. User must own the notification.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { notificationsTable, usersTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
        return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    const [notification] = await db
        .select({ id: notificationsTable.id, isRead: notificationsTable.isRead })
        .from(notificationsTable)
        .where(
            and(
                eq(notificationsTable.id, idNum),
                eq(notificationsTable.userId, user.id)
            )
        )
        .limit(1);

    if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (notification.isRead) {
        return NextResponse.json({ success: true, alreadyRead: true });
    }

    await db
        .update(notificationsTable)
        .set({ isRead: true })
        .where(eq(notificationsTable.id, idNum));

    return NextResponse.json({ success: true });
}
