/**
 * Notifications API — Phase 16.3 (deeppivot-241)
 *
 * GET /api/notifications — Paginated list of in-app notifications for the authenticated user.
 * Query params: ?page=1&limit=20 (default limit 20, max 100).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable, notificationsTable } from "@/src/db/schema";
import { eq, desc, count } from "drizzle-orm";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    const [totalResult, notifications] = await Promise.all([
        db
            .select({ count: count() })
            .from(notificationsTable)
            .where(eq(notificationsTable.userId, user.id)),
        db
            .select({
                id: notificationsTable.id,
                title: notificationsTable.title,
                body: notificationsTable.body,
                isRead: notificationsTable.isRead,
                type: notificationsTable.type,
                link: notificationsTable.link,
                createdAt: notificationsTable.createdAt,
            })
            .from(notificationsTable)
            .where(eq(notificationsTable.userId, user.id))
            .orderBy(desc(notificationsTable.createdAt))
            .limit(limit)
            .offset(offset),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return NextResponse.json({
        notifications: notifications.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            isRead: n.isRead,
            type: n.type,
            link: n.link,
            createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
        })),
        total: Number(total),
        page,
        limit,
        hasMore: offset + notifications.length < total,
    });
}
