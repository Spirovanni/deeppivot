import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/src/db";
import {
    usersTable,
    jobDescriptionsTable,
    userResumesTable,
} from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import { generateGapAnalysis } from "@/src/lib/llm/gap-analysis";

const gapAnalysisSchema = z.object({
    jobDescriptionId: z.number().int().positive(),
    resumeId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
    const rl = await rateLimit(request, "GAP_ANALYSIS");
    if (!rl.success) return rl.response;

    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // consistent with codebase
        const [user] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const userId = user.id;

        const body = await request.json();
        const parsed = gapAnalysisSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const { jobDescriptionId, resumeId } = parsed.data;

        // Verify job description
        const [jobDesc] = await db
            .select()
            .from(jobDescriptionsTable)
            .where(
                and(
                    eq(jobDescriptionsTable.id, jobDescriptionId),
                    eq(jobDescriptionsTable.userId, userId)
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
                    detail: `Current status: ${jobDesc.status}. Only job descriptions with status "extracted" can be used for gap analysis.`,
                },
                { status: 422 }
            );
        }

        // Verify resume
        const [resume] = await db
            .select({
                id: userResumesTable.id,
                parsedData: userResumesTable.parsedData,
                status: userResumesTable.status,
                rawText: userResumesTable.rawText,
            })
            .from(userResumesTable)
            .where(
                and(
                    eq(userResumesTable.id, resumeId),
                    eq(userResumesTable.userId, userId)
                )
            )
            .limit(1);

        if (!resume) {
            return NextResponse.json(
                { error: "Resume not found" },
                { status: 404 }
            );
        }

        if (resume.status !== "extracted" && resume.status !== "ready") {
            // Fallback: If status isn't explicitly extracted/ready but parsedData exists
            if (!resume.parsedData || Object.keys(resume.parsedData as object).length === 0) {
                return NextResponse.json(
                    {
                        error: "Resume data not yet extracted",
                        detail: `Resume status: ${resume.status}. Must be fully parsed.`,
                    },
                    { status: 422 }
                );
            }
        }

        // Generate Gap Analysis
        const gapAnalysis = await generateGapAnalysis(resume.parsedData, jobDesc.extractedData);

        return NextResponse.json({
            data: gapAnalysis
        });

    } catch (error) {
        console.error("Error generating gap analysis:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.flatten() },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error: "Failed to generate gap analysis",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
