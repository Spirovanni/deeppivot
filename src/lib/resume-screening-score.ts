/**
 * LLM-based resume screening score for employer-matched candidates (deeppivot-317).
 * Scores how well a candidate's resume fits a job description.
 */
import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { jobsTable, userResumesTable, usersTable } from "@/src/db/schema";
import { generateCompletion } from "@/src/lib/llm";

export type ResumeScreeningResult = {
  score: number;
  briefReason?: string;
};

function extractResumeSummary(parsedData: unknown, rawText: string | null): string {
  const p = parsedData as {
    summary?: string | null;
    skills?: string[];
    workExperience?: Array<{ company: string; title: string; highlights: string[] }>;
    yearsOfExperience?: string | null;
  } | null;
  const parts: string[] = [];
  if (p?.summary) parts.push(`Summary: ${p.summary}`);
  if (Array.isArray(p?.skills) && p.skills.length) {
    parts.push(`Skills: ${p.skills.slice(0, 15).join(", ")}`);
  }
  if (Array.isArray(p?.workExperience) && p.workExperience.length) {
    const recent = p.workExperience[0];
    parts.push(`Recent: ${recent.title} at ${recent.company}`);
    if (recent.highlights?.length) {
      parts.push(recent.highlights.slice(0, 2).join(" "));
    }
  }
  if (p?.yearsOfExperience) parts.push(`Experience: ${p.yearsOfExperience}`);
  if (rawText && parts.length < 2) {
    parts.push(`Raw: ${rawText.slice(0, 800)}`);
  }
  return parts.join("\n") || "No resume content available.";
}

/**
 * Generate an LLM-based resume screening score for a candidate against a job.
 * Returns 0-100 score and optional brief reason. Falls back to null if no resume or LLM fails.
 */
export async function generateResumeScreeningScore(
  jobId: number,
  candidateUserId: number
): Promise<ResumeScreeningResult | null> {
  const [job] = await db
    .select({ id: jobsTable.id, title: jobsTable.title, description: jobsTable.description })
    .from(jobsTable)
    .where(eq(jobsTable.id, jobId))
    .limit(1);

  if (!job) return null;

  const [resumeRow] = await db
    .select({
      parsedData: userResumesTable.parsedData,
      rawText: userResumesTable.rawText,
    })
    .from(userResumesTable)
    .where(eq(userResumesTable.userId, candidateUserId))
    .orderBy(desc(userResumesTable.createdAt))
    .limit(1);

  if (!resumeRow?.parsedData && !resumeRow?.rawText) return null;

  const resumeSummary = extractResumeSummary(resumeRow?.parsedData, resumeRow?.rawText ?? null);
  if (!resumeSummary || resumeSummary === "No resume content available.") return null;

  const jobContext = `${job.title}\n\n${job.description.slice(0, 1200)}`;

  try {
    const result = await generateCompletion({
      temperature: 0.2,
      maxTokens: 150,
      messages: [
        {
          role: "system",
          content: `You are an expert recruiter. Score how well a candidate's resume fits a job (0-100).
Reply with ONLY valid JSON: { "score": number, "reason": "1 short sentence" }.
Score 0-40: poor fit. 41-60: partial fit. 61-80: solid fit. 81-100: strong fit.`,
        },
        {
          role: "user",
          content: `Job:\n${jobContext}\n\nCandidate resume summary:\n${resumeSummary}\n\nRespond with JSON only.`,
        },
      ],
    });

    const trimmed = result.content.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : trimmed;
    const parsed = JSON.parse(jsonStr) as { score?: number; reason?: string };

    const score = typeof parsed.score === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.score)))
      : 50;

    return {
      score,
      briefReason: typeof parsed.reason === "string" ? parsed.reason.trim().slice(0, 200) : undefined,
    };
  } catch {
    return null;
  }
}
