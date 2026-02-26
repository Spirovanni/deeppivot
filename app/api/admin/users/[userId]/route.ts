import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const uid = parseInt(userId);
    if (isNaN(uid)) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

    const body = await req.json();
    const allowed = ["role", "isSuspended", "isDeleted", "isActive"] as const;
    const updates: Partial<Record<(typeof allowed)[number], unknown>> = {};

    for (const key of allowed) {
        if (key in body) updates[key] = body[key];
    }

    // Soft delete: set deletedAt timestamp
    const patch: Record<string, unknown> = { ...updates, updatedAt: new Date() };
    if (body.isDeleted === true) {
        patch.deletedAt = new Date();
        patch.isActive = false;
    } else if (body.isDeleted === false) {
        patch.deletedAt = null;
        patch.isActive = true;
    }

    await db.update(usersTable).set(patch).where(eq(usersTable.id, uid));

    return NextResponse.json({ success: true });
}
