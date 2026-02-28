/**
 * Notifications API — Phase 16.3
 *
 * Stub route: enforces auth for real-time notification delivery.
 * Full implementation (DB, pagination) tracked in deeppivot-239, deeppivot-241.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    // Stub: return empty notifications until notifications table exists (deeppivot-239)
    return NextResponse.json({ notifications: [], total: 0 });
}
