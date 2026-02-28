import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { jobDescriptionsTable, usersTable } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { embedText, cosineSimilarity, deserializeEmbedding } from "@/src/lib/embeddings";
import { rateLimit } from "@/src/lib/rate-limit";

const searchSchema = z.object({
    /** Free-text query — e.g. "senior frontend engineer React TypeScript" */
    query: z.string().min(1).max(500),
    /** Max results to return (default 5, max 20) */
    topK: z.number().int().min(1).max(20).default(5),
    /** Minimum cosine-similarity threshold (0-1, default 0.3) */
    threshold: z.number().min(0).max(1).default(0.3),
});

/**
 * POST /api/job-descriptions/search
 *
 * Semantic search over the authenticated user's extracted job descriptions
 * using pre-computed OpenAI embeddings stored in the `embedding_vector` column.
 *
 * Body: { query: string, topK?: number, threshold?: number }
 *
 * Returns: Array of matching JDs sorted by cosine-similarity score (highest first).
 * JDs without an embedding vector are excluded from results.
 */
export async function POST(request: NextRequest) {
    const rl = await rateLimit(request, "ALT_ED_SEARCH");
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
        const parsed = searchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const { query, topK, threshold } = parsed.data;

        // Load all the user's extracted JDs that have an embedding vector
        const jds = await db
            .select({
                id: jobDescriptionsTable.id,
                title: jobDescriptionsTable.title,
                company: jobDescriptionsTable.company,
                status: jobDescriptionsTable.status,
                extractedData: jobDescriptionsTable.extractedData,
                embeddingVector: jobDescriptionsTable.embeddingVector,
                createdAt: jobDescriptionsTable.createdAt,
            })
            .from(jobDescriptionsTable)
            .where(
                eq(jobDescriptionsTable.userId, user.id)
            );

        const embeddedJds = jds.filter(
            (jd) => jd.status === "extracted" && jd.embeddingVector != null
        );

        if (embeddedJds.length === 0) {
            return NextResponse.json({ results: [], message: "No indexed job descriptions found." });
        }

        // Embed the query string
        const { embedding: queryEmbedding } = await embedText(query);

        // Score each JD by cosine similarity
        const scored = embeddedJds
            .map((jd) => {
                const vec = deserializeEmbedding(jd.embeddingVector as number[] | string | null);
                if (!vec) return null;
                const score = cosineSimilarity(queryEmbedding, vec);
                return { jd, score };
            })
            .filter((r): r is { jd: typeof embeddedJds[0]; score: number } =>
                r !== null && r.score >= threshold
            )
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        const results = scored.map(({ jd, score }) => {
            const extracted = jd.extractedData as {
                jobTitle?: string;
                technicalSkillsRequired?: string[];
                softSkillsRequired?: string[];
                yearsOfExperience?: string | null;
            } | null;

            return {
                id: jd.id,
                title: jd.title,
                company: jd.company,
                jobTitle: extracted?.jobTitle ?? jd.title,
                technicalSkills: extracted?.technicalSkillsRequired ?? [],
                softSkills: extracted?.softSkillsRequired ?? [],
                yearsOfExperience: extracted?.yearsOfExperience ?? null,
                score: Math.round(score * 1000) / 1000,
                createdAt: jd.createdAt,
            };
        });

        return NextResponse.json({ results });
    } catch (error) {
        console.error("[JD Search] Error:", error);
        return NextResponse.json(
            { error: "Semantic search failed", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
