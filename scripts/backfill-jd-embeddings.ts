/**
 * scripts/backfill-jd-embeddings.ts
 *
 * One-shot backfill: generates and stores OpenAI embedding vectors for all
 * extracted job descriptions that currently have no embedding_vector.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-jd-embeddings.ts
 *
 * Requires OPENAI_API_KEY and DATABASE_URL in env / .env.local.
 */

import "dotenv/config";
import { db } from "../src/db";
import { jobDescriptionsTable } from "../src/db/schema";
import { isNull, eq } from "drizzle-orm";
import { embedText } from "../src/lib/embeddings";
import type { JobDescriptionExtraction } from "../src/lib/llm/prompts/job-descriptions";

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

async function main() {
    console.log("🔍 Loading extracted JDs without embeddings…");

    const jds = await db
        .select()
        .from(jobDescriptionsTable)
        .where(isNull(jobDescriptionsTable.embeddingVector));

    const extracted = jds.filter((jd) => jd.status === "extracted" && jd.extractedData);

    console.log(`📋 Found ${extracted.length} JDs to embed (${jds.length - extracted.length} skipped — not yet extracted)`);

    let success = 0;
    let failed = 0;

    for (const jd of extracted) {
        try {
            const data = jd.extractedData as JobDescriptionExtraction;
            const text = buildJdEmbeddingText(jd.title, jd.company, data);
            const { embedding, tokens } = await embedText(text);

            await db
                .update(jobDescriptionsTable)
                .set({ embeddingVector: embedding, updatedAt: new Date() })
                .where(eq(jobDescriptionsTable.id, jd.id));

            console.log(`  ✅ JD #${jd.id} "${jd.title}" — ${tokens} tokens`);
            success++;
        } catch (err) {
            console.error(`  ❌ JD #${jd.id} "${jd.title}" — ${err instanceof Error ? err.message : err}`);
            failed++;
        }

        // Small rate-limit buffer between API calls
        await new Promise((r) => setTimeout(r, 100));
    }

    console.log(`\n✔ Done — ${success} embedded, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
