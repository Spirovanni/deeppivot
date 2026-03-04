/**
 * Inngest cron: Calculate nightly candidate matches for new marketplace jobs.
 *
 * Phase 16.5 (deeppivot-299)
 */

import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { inngest } from "@/src/inngest/client";
import { db } from "@/src/db";
import {
  jobMatchesTable,
  jobsTable,
  userResumesTable,
  usersTable,
} from "@/src/db/schema";
import { cosineSimilarity, deserializeEmbedding } from "@/src/lib/embeddings";

const NEW_JOB_WINDOW_HOURS = 36;
const MAX_MATCHES_PER_JOB = 100;
const MIN_MATCH_SCORE = 55;

export const nightlyJobMatches = inngest.createFunction(
  {
    id: "nightly-job-matches",
    name: "Calculate Nightly Matches For New Jobs",
    retries: 1,
  },
  { cron: "0 5 * * *" }, // 5 AM UTC daily
  async ({ step }) => {
    const since = new Date(Date.now() - NEW_JOB_WINDOW_HOURS * 60 * 60 * 1000);

    const jobs = await step.run("load-new-published-jobs", async () => {
      return db
        .select({
          id: jobsTable.id,
          embeddingVector: jobsTable.embeddingVector,
        })
        .from(jobsTable)
        .where(
          and(
            eq(jobsTable.status, "published"),
            gte(jobsTable.createdAt, since),
            isNotNull(jobsTable.embeddingVector)
          )
        );
    });

    if (jobs.length === 0) {
      return { processedJobs: 0, insertedOrUpdated: 0 };
    }

    const candidateRows = await step.run("load-eligible-candidates", async () => {
      return db
        .select({
          userId: usersTable.id,
          resumeEmbedding: userResumesTable.embeddingVector,
        })
        .from(usersTable)
        .innerJoin(userResumesTable, eq(userResumesTable.userId, usersTable.id))
        .where(
          and(
            eq(usersTable.role, "user"),
            eq(usersTable.openToOpportunities, true),
            eq(usersTable.isDeleted, false),
            isNotNull(userResumesTable.embeddingVector)
          )
        )
        .orderBy(desc(userResumesTable.createdAt));
    });

    // Keep latest resume embedding per user.
    const latestResumeEmbeddingByUser = new Map<number, number[]>();
    for (const row of candidateRows) {
      if (latestResumeEmbeddingByUser.has(row.userId)) continue;
      const embedding = deserializeEmbedding(row.resumeEmbedding as number[] | null);
      if (embedding) latestResumeEmbeddingByUser.set(row.userId, embedding);
    }

    let insertedOrUpdated = 0;

    for (const job of jobs) {
      const jobEmbedding = deserializeEmbedding(job.embeddingVector as number[] | null);
      if (!jobEmbedding) continue;

      const scores: Array<{ userId: number; matchScore: number }> = [];

      for (const [userId, resumeEmbedding] of latestResumeEmbeddingByUser) {
        const similarity = cosineSimilarity(jobEmbedding, resumeEmbedding);
        const normalized = Math.max(0, Math.min(1, (similarity + 1) / 2));
        const matchScore = Math.round(normalized * 100);
        if (matchScore >= MIN_MATCH_SCORE) {
          scores.push({ userId, matchScore });
        }
      }

      scores.sort((a, b) => b.matchScore - a.matchScore);
      const top = scores.slice(0, MAX_MATCHES_PER_JOB);
      if (top.length === 0) continue;

      await step.run(`upsert-job-matches-${job.id}`, async () => {
        await db
          .insert(jobMatchesTable)
          .values(
            top.map((row) => ({
              jobId: job.id,
              userId: row.userId,
              matchScore: row.matchScore,
              status: "suggested",
              updatedAt: new Date(),
            }))
          )
          .onConflictDoUpdate({
            target: [jobMatchesTable.jobId, jobMatchesTable.userId],
            set: {
              matchScore: sql`excluded."matchScore"`,
              updatedAt: new Date(),
            },
          });
      });

      insertedOrUpdated += top.length;
    }

    return {
      processedJobs: jobs.length,
      insertedOrUpdated,
      candidatePool: latestResumeEmbeddingByUser.size,
    };
  }
);

