import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;

    let reqUser;
    try {
        reqUser = await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const uid = parseInt(userId);
    if (isNaN(uid)) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

    const [targetUser] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, uid));
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const allowed = ["role", "isSuspended", "isDeleted", "isActive"] as const;
    const updates: Partial<Record<(typeof allowed)[number], unknown>> = {};

    for (const key of allowed) {
        if (key in body) updates[key] = body[key];
    }

    // Role change security check
    if (updates.role) {
        const isEditingAdmin = targetUser.role === "admin" || targetUser.role === "system_admin";
        const isGrantingAdmin = updates.role === "admin" || updates.role === "system_admin";

        if ((isEditingAdmin || isGrantingAdmin) && reqUser.role !== "system_admin") {
            return NextResponse.json({ error: "Only System Administrators can manage admin roles" }, { status: 403 });
        }
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
