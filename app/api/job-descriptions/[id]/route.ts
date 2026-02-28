import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { jobDescriptionsTable, usersTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateJobDescriptionSchema = z.object({
    title: z.string().min(1, "Job title is required").max(255).optional(),
    company: z.string().max(255).optional(),
    content: z.string().min(1, "Job description content is required").optional(),
    url: z.string().url("Must be a valid URL").max(1024).optional().or(z.literal("")).optional(),
    status: z.enum(["pending", "extracted", "failed"]).optional(),
    extractedData: z.any().optional(), // Flexible JSONB for now
});

export async function PATCH(
    req: Request,
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

        const { id: jobIdString } = await params;
        const jobId = parseInt(jobIdString, 10);

        if (isNaN(jobId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Verify ownership
        const [existing] = await db
            .select()
            .from(jobDescriptionsTable)
            .where(
                and(
                    eq(jobDescriptionsTable.id, jobId),
                    eq(jobDescriptionsTable.userId, user.id)
                )
            )
            .limit(1);

        if (!existing) {
            return NextResponse.json(
                { error: "Job description not found or access denied" },
                { status: 404 }
            );
        }

        const body = await req.json();

        if (body.url === "") {
            body.url = undefined;
        }

        const validatedData = updateJobDescriptionSchema.parse(body);

        // Only update if there are keys to update
        if (Object.keys(validatedData).length === 0) {
            return NextResponse.json({ success: true, id: existing.id });
        }

        const [updatedJobDesc] = await db
            .update(jobDescriptionsTable)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(jobDescriptionsTable.id, existing.id))
            .returning();

        return NextResponse.json({ success: true, id: updatedJobDesc.id });
    } catch (error: any) { // Changed error type to any for better type safety
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error(`Error updating job description:`, error);
        return NextResponse.json(
            { error: "Failed to update job description" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
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

        const { id: jobIdString } = await params;
        const jobId = parseInt(jobIdString, 10);

        if (isNaN(jobId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Verify ownership
        const [existing] = await db
            .select()
            .from(jobDescriptionsTable)
            .where(
                and(
                    eq(jobDescriptionsTable.id, jobId),
                    eq(jobDescriptionsTable.userId, user.id)
                )
            )
            .limit(1);

        if (!existing) {
            return NextResponse.json(
                { error: "Job description not found or access denied" },
                { status: 404 }
            );
        }

        await db
            .delete(jobDescriptionsTable)
            .where(eq(jobDescriptionsTable.id, existing.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error deleting job description:`, error);
        return NextResponse.json(
            { error: "Failed to delete job description" },
            { status: 500 }
        );
    }
}
