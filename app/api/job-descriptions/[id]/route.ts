import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { jobDescriptionsTable, usersTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { extractJobDescriptionData } from "@/lib/llm/job-description-parser";
import { embedText, serializeEmbedding } from "@/src/lib/embeddings";
import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";

function buildJdEmbeddingText(
    title: string,
    company: string | undefined | null,
    extracted: JobDescriptionExtraction
): string {
    const parts: string[] = [
        `Job Title: ${extracted.jobTitle ?? title}`,
        extracted.companyName || company
            ? `Company: ${extracted.companyName ?? company}`
            : "",
        extracted.technicalSkillsRequired?.length
            ? `Technical Skills: ${extracted.technicalSkillsRequired.join(", ")}`
            : "",
        extracted.softSkillsRequired?.length
            ? `Soft Skills: ${extracted.softSkillsRequired.join(", ")}`
            : "",
        extracted.yearsOfExperience
            ? `Experience: ${extracted.yearsOfExperience}`
            : "",
        extracted.primaryResponsibilities?.length
            ? `Responsibilities: ${extracted.primaryResponsibilities.join(". ")}`
            : "",
        extracted.companyCulture
            ? `Culture: ${extracted.companyCulture}`
            : "",
        extracted.likelyInterviewTopics?.length
            ? `Interview Topics: ${extracted.likelyInterviewTopics.join(", ")}`
            : "",
    ];
    return parts.filter(Boolean).join("\n");
}

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

        let statusToSet = validatedData.status || existing.status;
        let extractedDataToSet = validatedData.extractedData || existing.extractedData;

        // If 'content' was updated, we should re-extract and re-embed
        let newEmbeddingVector: number[] | null | undefined = undefined; // undefined = don't touch existing
        if (validatedData.content && validatedData.content !== existing.content) {
            try {
                const newExtractedData = await extractJobDescriptionData(validatedData.content);
                statusToSet = "extracted";
                extractedDataToSet = newExtractedData;

                // Re-generate embedding for the updated content
                try {
                    const title = validatedData.title ?? existing.title;
                    const company = validatedData.company ?? existing.company;
                    const embeddingText = buildJdEmbeddingText(title, company, newExtractedData);
                    const { embedding } = await embedText(embeddingText);
                    newEmbeddingVector = embedding;
                } catch (embErr) {
                    console.warn(`[JD] Re-embedding failed for JD ${existing.id}:`, embErr);
                }
            } catch (error) {
                console.error(`Failed to re-extract JD data for job ${existing.id}:`, error);
                statusToSet = "failed";
                extractedDataToSet = existing.extractedData;
            }
        }

        const updatePayload: Record<string, unknown> = {
            ...validatedData,
            status: statusToSet,
            extractedData: extractedDataToSet,
            updatedAt: new Date(),
        };
        if (newEmbeddingVector !== undefined) {
            updatePayload.embeddingVector = newEmbeddingVector;
        }

        const [updatedJobDesc] = await db
            .update(jobDescriptionsTable)
            .set(updatePayload)
            .where(eq(jobDescriptionsTable.id, existing.id))
            .returning();

        return NextResponse.json({ success: true, id: updatedJobDesc.id });
    } catch (error: any) { // Changed error type to any for better type safety
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: (error as any).errors },
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
