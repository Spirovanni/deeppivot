import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { userGamificationTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import { z } from "zod";

const grantSchema = z.object({
    points: z.number().int().min(1, "Points must be at least 1").max(10000, "Max 10,000 per grant"),
});

/** POST: Admin grant points to a user */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;

    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const uid = parseInt(userId);
    if (isNaN(uid)) {
        return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const [targetUser] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, uid));
    if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = grantSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { points } = parsed.data;

    const [existing] = await db
        .select({ id: userGamificationTable.id, points: userGamificationTable.points })
        .from(userGamificationTable)
        .where(eq(userGamificationTable.userId, uid))
        .limit(1);

    if (existing) {
        const newPoints = existing.points + points;
        await db
            .update(userGamificationTable)
            .set({
                points: newPoints,
                lastActivityAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(userGamificationTable.userId, uid));
        return NextResponse.json({
            success: true,
            pointsAdded: points,
            newTotal: newPoints,
        });
    }

    await db.insert(userGamificationTable).values({
        userId: uid,
        points,
        currentStreak: 0,
        highestStreak: 0,
        lastActivityAt: new Date(),
    });
    return NextResponse.json({
        success: true,
        pointsAdded: points,
        newTotal: points,
    });
}
