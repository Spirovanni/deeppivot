/**
 * Matching feedback: record application outcomes and improve matching weights (Phase 16.5).
 *
 * When employers set application status to hired/rejected, we record signals.
 * Aggregate function updates weights based on which signals correlate with success.
 */

import { db } from "@/src/db";
import {
    matchingFeedbackTable,
    matchingWeightsTable,
    jobMarketplaceApplicationsTable,
    userResumesTable,
} from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

export const DEFAULT_WEIGHTS: Record<string, number> = {
  has_resume: 1.2,
  has_cover_letter: 1.1,
  resume_skills_count: 0.02, // per skill
};

/**
 * Record feedback when an application receives outcome (hired/rejected).
 * Computes signals from application data and user resume. Idempotent per application.
 */
export async function recordMatchingFeedback(
  marketplaceApplicationId: number,
  outcome: "hired" | "rejected"
): Promise<void> {
  try {
    const [app] = await db
      .select({
        id: jobMarketplaceApplicationsTable.id,
        userId: jobMarketplaceApplicationsTable.userId,
        resumeUrl: jobMarketplaceApplicationsTable.resumeUrl,
        coverLetter: jobMarketplaceApplicationsTable.coverLetter,
      })
      .from(jobMarketplaceApplicationsTable)
      .where(eq(jobMarketplaceApplicationsTable.id, marketplaceApplicationId))
      .limit(1);

    if (!app) return;

    let resumeSkillsCount = 0;
    const [resume] = await db
      .select({ parsedData: userResumesTable.parsedData })
      .from(userResumesTable)
      .where(eq(userResumesTable.userId, app.userId))
      .orderBy(desc(userResumesTable.createdAt))
      .limit(1);

    if (resume?.parsedData && typeof resume.parsedData === "object" && Array.isArray((resume.parsedData as ResumeExtraction).skills)) {
      resumeSkillsCount = (resume.parsedData as ResumeExtraction).skills.length;
    }

    await db
      .insert(matchingFeedbackTable)
      .values({
        marketplaceApplicationId,
        outcome,
        hasResume: !!app.resumeUrl,
        hasCoverLetter: !!app.coverLetter,
        resumeSkillsCount,
      })
      .onConflictDoUpdate({
        target: matchingFeedbackTable.marketplaceApplicationId,
        set: {
          outcome,
          hasResume: !!app.resumeUrl,
          hasCoverLetter: !!app.coverLetter,
          resumeSkillsCount,
        },
      });
  } catch (err) {
    console.error("[matching-feedback] recordMatchingFeedback failed:", err);
  }
}

/**
 * Aggregate feedback to update matching weights. Hired apps with more positive
 * signals should increase those weights; rejected with positive signals may indicate
 * other factors. Simple heuristic: boost weight if signal is more common in hired vs rejected.
 */
export async function aggregateMatchingFeedback(): Promise<{
  updated: number;
  summary: Record<string, { hiredAvg: number; rejectedAvg: number; newWeight: number }>;
}> {
  const feedback = await db.select().from(matchingFeedbackTable);

  if (feedback.length < 5) {
    return { updated: 0, summary: {} };
  }

  const hired = feedback.filter((f) => f.outcome === "hired");
  const rejected = feedback.filter((f) => f.outcome === "rejected");
  if (hired.length === 0 || rejected.length === 0) return { updated: 0, summary: {} };

  const summary: Record<string, { hiredAvg: number; rejectedAvg: number; newWeight: number }> = {};
  const updates: Array<{ key: string; weight: number }> = [];

  // has_resume: % of hired/rejected with resume
  const hiredWithResume = hired.filter((f) => f.hasResume).length / hired.length;
  const rejectedWithResume = rejected.filter((f) => f.hasResume).length / rejected.length;
  const resumeWeight = Math.max(0.5, Math.min(2, DEFAULT_WEIGHTS.has_resume * (0.8 + 0.4 * (hiredWithResume - rejectedWithResume))));
  summary.has_resume = { hiredAvg: hiredWithResume, rejectedAvg: rejectedWithResume, newWeight: resumeWeight };
  updates.push({ key: "has_resume", weight: resumeWeight });

  // has_cover_letter
  const hiredWithCl = hired.filter((f) => f.hasCoverLetter).length / hired.length;
  const rejectedWithCl = rejected.filter((f) => f.hasCoverLetter).length / rejected.length;
  const clWeight = Math.max(0.5, Math.min(2, DEFAULT_WEIGHTS.has_cover_letter * (0.8 + 0.4 * (hiredWithCl - rejectedWithCl))));
  summary.has_cover_letter = { hiredAvg: hiredWithCl, rejectedAvg: rejectedWithCl, newWeight: clWeight };
  updates.push({ key: "has_cover_letter", weight: clWeight });

  // resume_skills_count: avg skills in hired vs rejected
  const hiredAvgSkills = hired.reduce((s, f) => s + f.resumeSkillsCount, 0) / hired.length;
  const rejectedAvgSkills = rejected.reduce((s, f) => s + f.resumeSkillsCount, 0) / rejected.length;
  const diff = hiredAvgSkills - rejectedAvgSkills;
  const skillsWeight = Math.max(0.005, Math.min(0.05, DEFAULT_WEIGHTS.resume_skills_count * (1 + Math.sign(diff) * 0.2)));
  summary.resume_skills_count = { hiredAvg: hiredAvgSkills, rejectedAvg: rejectedAvgSkills, newWeight: skillsWeight };
  updates.push({ key: "resume_skills_count", weight: skillsWeight });

  for (const { key, weight } of updates) {
    await db
      .insert(matchingWeightsTable)
      .values({ key, weight, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: matchingWeightsTable.key,
        set: { weight, updatedAt: new Date() },
      });
  }

  return { updated: updates.length, summary };
}

/**
 * Get current matching weights. Returns DB values or defaults.
 */
export async function getMatchingWeights(): Promise<Record<string, number>> {
  const rows = await db.select().from(matchingWeightsTable);
  const result = { ...DEFAULT_WEIGHTS };
  for (const r of rows) {
    result[r.key] = r.weight;
  }
  return result;
}
