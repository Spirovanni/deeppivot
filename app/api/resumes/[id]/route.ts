import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { userResumesTable, usersTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    isDefault: z.boolean().optional(),
});

export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
            return NextResponse.json({ error: "Invalid resume ID" }, { status: 400 });
        }

        const [existing] = await db
            .select({ id: userResumesTable.id })
            .from(userResumesTable)
            .where(
                and(
                    eq(userResumesTable.id, idNum),
                    eq(userResumesTable.userId, user.id)
                )
            )
            .limit(1);

        if (!existing) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        const body = await _req.json().catch(() => ({}));
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (parsed.data.title !== undefined) updates.title = parsed.data.title;
        if (parsed.data.isDefault !== undefined) updates.isDefault = parsed.data.isDefault;

        if (parsed.data.isDefault === true) {
            await db
                .update(userResumesTable)
                .set({ isDefault: false, updatedAt: new Date() })
                .where(eq(userResumesTable.userId, user.id));
        }

        const [updated] = await db
            .update(userResumesTable)
            .set(updates)
            .where(eq(userResumesTable.id, idNum))
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating resume:", error);
        return NextResponse.json(
            { error: "Failed to update resume" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
            return NextResponse.json({ error: "Invalid resume ID" }, { status: 400 });
        }

        const [existing] = await db
            .select({ id: userResumesTable.id })
            .from(userResumesTable)
            .where(
                and(
                    eq(userResumesTable.id, idNum),
                    eq(userResumesTable.userId, user.id)
                )
            )
            .limit(1);

        if (!existing) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        await db
            .delete(userResumesTable)
            .where(eq(userResumesTable.id, idNum));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting resume:", error);
        return NextResponse.json(
            { error: "Failed to delete resume" },
            { status: 500 }
        );
    }
}
