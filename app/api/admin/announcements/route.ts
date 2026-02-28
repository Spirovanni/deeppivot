/**
 * Admin announcements broadcast API — Phase 16.3
 *
 * Stub route: enforces admin auth for broadcast capability.
 * Full implementation (admin_announcements table, delivery) tracked in deeppivot-240.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/rbac";

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Stub: validate body and return success until admin_announcements table exists
        const body = await req.json().catch(() => ({}));
        const { title, body: content } = body;
        if (!title || typeof title !== "string") {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }
        // Placeholder: would insert into admin_announcements and trigger delivery
        return NextResponse.json({
            success: true,
            message: "Broadcast queued (stub)",
        });
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
