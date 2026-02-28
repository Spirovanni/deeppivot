import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/src/db";
import { usersTable, jobDescriptionsTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import { generateTechnicalQuestions } from "@/src/lib/llm/technical-question-generator";
import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";

const generateQuestionsSchema = z.object({
    jobDescriptionId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
    const rl = await rateLimit(request, "INTERVIEW_START");
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
        const parsed = generateQuestionsSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { jobDescriptionId } = parsed.data;

        // Verify ownership and extraction status
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
                    detail: `Current status: ${jobDesc.status}. Only job descriptions with status "extracted" can be used for question generation.`,
                },
                { status: 422 }
            );
        }

        const extractedData = jobDesc.extractedData as JobDescriptionExtraction;

        const result = await generateTechnicalQuestions(extractedData);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error generating technical questions:", error);
        return NextResponse.json(
            {
                error: "Failed to generate technical questions",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
