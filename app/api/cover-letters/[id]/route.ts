import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/src/db";
import { usersTable, coverLettersTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import { uploadToR2 } from "@/src/lib/storage";

const patchSchema = z.object({
    content: z.string().min(1).optional(),
    tone: z.enum(["professional", "conversational", "enthusiastic"]).optional(),
    status: z.string().max(50).optional(),
});

/**
 * PATCH /api/cover-letters/[id]
 *
 * Save edits to an existing cover letter.
 * Only the owner can update their cover letter.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const rl = await rateLimit(request, "DEFAULT");
    if (!rl.success) return rl.response;

    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const idNum = parseInt(id, 10);
        if (!Number.isInteger(idNum) || idNum <= 0) {
            return NextResponse.json({ error: "Invalid cover letter ID" }, { status: 400 });
        }

        const [user] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const updates = parsed.data;
        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        const [existing] = await db
            .select({ id: coverLettersTable.id, userId: coverLettersTable.userId })
            .from(coverLettersTable)
            .where(eq(coverLettersTable.id, idNum))
            .limit(1);

        if (!existing) {
            return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });
        }

        if (existing.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }


        const [updated] = await db
            .update(coverLettersTable)
            .set({
                ...(updates.content !== undefined && { content: updates.content }),
                ...(updates.tone !== undefined && { tone: updates.tone }),
                ...(updates.status !== undefined && { status: updates.status }),
                updatedAt: new Date(),
            })
            .where(and(eq(coverLettersTable.id, idNum), eq(coverLettersTable.userId, user.id)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Update failed" }, { status: 500 });
        }

        // Sync with R2 if content changed
        if (updates.content !== undefined) {
            try {
                const r2Key = `cover-letters/${user.id}/${updated.id}.md`;
                const fileUrl = await uploadToR2(r2Key, updated.content, "text/markdown");

                // Update fileUrl in DB (silent sync)
                await db
                    .update(coverLettersTable)
                    .set({ fileUrl })
                    .where(eq(coverLettersTable.id, updated.id));
            } catch (r2Err) {
                console.error("Failed to sync cover letter to R2 during update:", r2Err);
            }
        }

        return NextResponse.json({
            id: updated.id,
            content: updated.content,
            tone: updated.tone,
            status: updated.status,
            updatedAt: updated.updatedAt,
        });
    } catch (error) {
        console.error("Error updating cover letter:", error);
        return NextResponse.json(
            {
                error: "Failed to save cover letter",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
