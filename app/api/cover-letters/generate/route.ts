import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/src/db";
import {
    usersTable,
    jobDescriptionsTable,
    userResumesTable,
    coverLettersTable,
    jobApplicationsTable,
} from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import { mergeCoverLetterContext } from "@/src/lib/cover-letter/merge-context";
import { generateCoverLetter } from "@/src/lib/llm/cover-letter-generator";
import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

const generateSchema = z.object({
    jobDescriptionId: z.number().int().positive(),
    resumeId: z.number().int().positive().optional(),
    tone: z.enum(["professional", "conversational", "enthusiastic"]).default("professional"),
    /** Link to Job Tracker application after creation (deeppivot-235) */
    jobApplicationId: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
    const rl = await rateLimit(request, "COVER_LETTER_GENERATE");
    if (!rl.success) return rl.response;

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

        const body = await request.json();
        const parsed = generateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { jobDescriptionId, resumeId, tone, jobApplicationId } = parsed.data;

        // Fetch and verify job description
        const [jobDesc] = await db
            .select()
            .from(jobDescriptionsTable)
            .where(
                and(
                    eq(jobDescriptionsTable.id, jobDescriptionId),
                    eq(jobDescriptionsTable.userId, user.id)
                )
            )
            .limit(1);

        if (!jobDesc) {
            return NextResponse.json(
                { error: "Job description not found" },
                { status: 404 }
            );
        }

        if (jobDesc.status !== "extracted") {
            return NextResponse.json(
                {
                    error: "Job description data not yet extracted",
                    detail: `Current status: ${jobDesc.status}. Only extracted job descriptions can be used.`,
                },
                { status: 422 }
            );
        }

        const jdData = jobDesc.extractedData as JobDescriptionExtraction;

        // Optionally fetch resume
        let resumeData: ResumeExtraction | null = null;
        if (resumeId) {
            const [resume] = await db
                .select()
                .from(userResumesTable)
                .where(
                    and(
                        eq(userResumesTable.id, resumeId),
                        eq(userResumesTable.userId, user.id)
                    )
                )
                .limit(1);

            if (!resume) {
                return NextResponse.json(
                    { error: "Resume not found" },
                    { status: 404 }
                );
            }

            if (resume.status === "extracted" && resume.parsedData) {
                resumeData = resume.parsedData as ResumeExtraction;
            }
        }

        // Merge JD + Resume context
        const context = mergeCoverLetterContext(jdData, resumeData);

        // Generate cover letter via LLM
        const result = await generateCoverLetter(context, tone);

        // Save to database
        const [coverLetter] = await db
            .insert(coverLettersTable)
            .values({
                userId: user.id,
                jobDescriptionId,
                resumeId: resumeId ?? null,
                content: result.body,
                tone,
                status: "generated",
            })
            .returning();

        // Link to Job Tracker application if provided (deeppivot-235)
        if (jobApplicationId && coverLetter) {
            await db
                .update(jobApplicationsTable)
                .set({
                    coverLetterId: coverLetter.id,
                    jobDescriptionId,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(jobApplicationsTable.id, jobApplicationId),
                        eq(jobApplicationsTable.userId, user.id)
                    )
                );
        }

        return NextResponse.json({
            id: coverLetter.id,
            subject: result.subject,
            body: result.body,
            tone,
        });
    } catch (error) {
        console.error("Error generating cover letter:", error);
        return NextResponse.json(
            {
                error: "Failed to generate cover letter",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
