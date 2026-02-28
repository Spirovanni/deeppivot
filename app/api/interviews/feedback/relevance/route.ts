import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/src/db";
import {
    usersTable,
    interviewSessionsTable,
    interviewQuestionsTable,
    jobDescriptionsTable,
} from "@/src/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import { rateAnswerRelevance } from "@/src/lib/llm/answer-relevance-rater";
import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";

const relevanceSchema = z.object({
    sessionId: z.number().int().positive(),
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
        const parsed = relevanceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { sessionId } = parsed.data;

        // Fetch session, verify ownership and that it has a linked job description
        const [session] = await db
            .select({
                id: interviewSessionsTable.id,
                userId: interviewSessionsTable.userId,
                jobDescriptionId: interviewSessionsTable.jobDescriptionId,
                status: interviewSessionsTable.status,
            })
            .from(interviewSessionsTable)
            .where(
                and(
                    eq(interviewSessionsTable.id, sessionId),
                    eq(interviewSessionsTable.userId, user.id)
                )
            )
            .limit(1);

        if (!session) {
            return NextResponse.json(
                { error: "Interview session not found" },
                { status: 404 }
            );
        }

        if (!session.jobDescriptionId) {
            return NextResponse.json(
                {
                    error: "This session has no linked job description",
                    detail: "Answer relevance scoring requires a context-aware interview session with a linked job description.",
                },
                { status: 422 }
            );
        }

        // Fetch the job description's extracted data
        const [jobDesc] = await db
            .select()
            .from(jobDescriptionsTable)
            .where(eq(jobDescriptionsTable.id, session.jobDescriptionId))
            .limit(1);

        if (!jobDesc || jobDesc.status !== "extracted") {
            return NextResponse.json(
                { error: "Job description data is not available" },
                { status: 422 }
            );
        }

        const extractedData = jobDesc.extractedData as JobDescriptionExtraction;

        // Fetch the session's question-answer pairs
        const questions = await db
            .select({
                questionText: interviewQuestionsTable.questionText,
                questionCategory: interviewQuestionsTable.questionCategory,
            })
            .from(interviewQuestionsTable)
            .where(eq(interviewQuestionsTable.sessionId, sessionId))
            .orderBy(asc(interviewQuestionsTable.orderIndex));

        if (questions.length === 0) {
            return NextResponse.json(
                { error: "No questions found for this session" },
                { status: 422 }
            );
        }

        // Build Q&A pairs from the stored questions
        // Questions are stored with the full text; answers come from the transcript
        // For now, use questionText which may contain both Q and A context
        const qaPairs = questions.map((q) => ({
            question: q.questionText,
            answer: "", // Answers are embedded in the live transcript, not stored separately
        }));

        const result = await rateAnswerRelevance(extractedData, qaPairs);

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error rating answer relevance:", error);
        return NextResponse.json(
            {
                error: "Failed to rate answer relevance",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
