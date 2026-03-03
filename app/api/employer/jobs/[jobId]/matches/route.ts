import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, avg, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import {
  careerArchetypesTable,
  companiesTable,
  employerJobInvitationsTable,
  interviewSessionsTable,
  jobMarketplaceApplicationsTable,
  jobsTable,
  userResumesTable,
  usersTable,
} from "@/src/db/schema";
import { rateLimit } from "@/src/lib/rate-limit";
import { getMatchingWeights } from "@/src/lib/matching-feedback";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

type CandidateRow = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  archetypeName: string | null;
  parsedData: ResumeExtraction | null;
};

const STOP_WORDS = new Set([
  "with", "that", "this", "from", "your", "will", "have", "years", "year",
  "experience", "role", "team", "work", "skills", "ability", "about", "their",
  "they", "them", "for", "and", "the", "you", "our", "are", "job", "position",
  "strong", "plus", "must", "nice", "required",
]);

function toTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function getJobKeywords(title: string, description: string): Set<string> {
  const tokens = toTokens(`${title} ${description}`);
  return new Set(tokens.slice(0, 80));
}

function getResumeSkills(parsedData: ResumeExtraction | null): string[] {
  if (!parsedData || !Array.isArray(parsedData.skills)) return [];
  return parsedData.skills
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 25);
}

function getResumeSkillTokens(skills: string[]): Set<string> {
  const tokens: string[] = [];
  for (const skill of skills) {
    tokens.push(...toTokens(skill));
  }
  return new Set(tokens);
}

/**
 * GET /api/employer/jobs/[jobId]/matches
 *
 * Returns top matched candidates for a specific employer-owned job.
 * Scores are deterministic and combine:
 * - skill overlap (job text vs resume skills)
 * - interview performance (historical average)
 * - archetype text overlap (light signal)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const rl = await rateLimit(req, "DEFAULT");
  if (!rl.success) return rl.response;

  try {
    const { jobId } = await params;
    const jobIdNum = Number.parseInt(jobId, 10);
    if (!Number.isInteger(jobIdNum) || jobIdNum <= 0) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUser.id))
      .limit(1);

    if (!dbUser || (dbUser.role !== "employer" && dbUser.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [job] = await db
      .select({
        id: jobsTable.id,
        title: jobsTable.title,
        description: jobsTable.description,
      })
      .from(jobsTable)
      .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
      .where(
        dbUser.role === "admin"
          ? eq(jobsTable.id, jobIdNum)
          : and(eq(jobsTable.id, jobIdNum), eq(companiesTable.ownerUserId, dbUser.id))
      )
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 });
    }

    const appliedRows = await db
      .select({ userId: jobMarketplaceApplicationsTable.userId })
      .from(jobMarketplaceApplicationsTable)
      .where(eq(jobMarketplaceApplicationsTable.jobId, jobIdNum));

    const invitedRows = await db
      .select({ userId: employerJobInvitationsTable.candidateUserId })
      .from(employerJobInvitationsTable)
      .where(eq(employerJobInvitationsTable.jobId, jobIdNum));

    const excludedCandidateIds = new Set<number>([
      ...appliedRows.map((row) => row.userId),
      ...invitedRows.map((row) => row.userId),
    ]);

    const weights = await getMatchingWeights();
    const resumeWeight = weights.has_resume ?? 1;
    const skillsCountWeight = weights.resume_skills_count ?? 0.02;
    const coverLetterWeight = weights.has_cover_letter ?? 1;

    const candidates = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        archetypeName: careerArchetypesTable.archetypeName,
        parsedData: userResumesTable.parsedData,
      })
      .from(usersTable)
      .leftJoin(careerArchetypesTable, eq(careerArchetypesTable.userId, usersTable.id))
      .leftJoin(userResumesTable, eq(userResumesTable.userId, usersTable.id))
      .where(
        and(
          eq(usersTable.role, "user"),
          eq(usersTable.openToOpportunities, true),
          isNull(usersTable.deletedAt)
        )
      )
      .orderBy(desc(usersTable.updatedAt))
      .limit(150);

    // Keep latest row per user when multiple resume rows are present.
    const candidateMap = new Map<number, CandidateRow>();
    for (const row of candidates) {
      if (!candidateMap.has(row.id)) {
        candidateMap.set(row.id, {
          id: row.id,
          name: row.name,
          email: row.email,
          avatarUrl: row.avatarUrl,
          archetypeName: row.archetypeName,
          parsedData: (row.parsedData as ResumeExtraction | null) ?? null,
        });
      }
    }

    const uniqueCandidates = [...candidateMap.values()].filter(
      (candidate) => !excludedCandidateIds.has(candidate.id)
    );

    const candidateIds = uniqueCandidates.map((candidate) => candidate.id);
    const interviewScoreRows = candidateIds.length
      ? await db
          .select({
            userId: interviewSessionsTable.userId,
            avgScore: avg(interviewSessionsTable.overallScore),
          })
          .from(interviewSessionsTable)
          .where(
            and(
              inArray(interviewSessionsTable.userId, candidateIds),
              eq(interviewSessionsTable.status, "completed"),
              isNull(interviewSessionsTable.deletedAt)
            )
          )
          .groupBy(interviewSessionsTable.userId)
      : [];

    const interviewScoreMap = new Map<number, number>();
    for (const row of interviewScoreRows) {
      if (row.avgScore != null) {
        interviewScoreMap.set(row.userId, Math.round(Number(row.avgScore)));
      }
    }

    const jobKeywords = getJobKeywords(job.title, job.description);

    const scoredCandidates = uniqueCandidates.map((candidate) => {
      const skills = getResumeSkills(candidate.parsedData);
      const skillTokens = getResumeSkillTokens(skills);
      const matchedKeywords = [...jobKeywords].filter((token) => skillTokens.has(token));

      const overlapScore = jobKeywords.size
        ? Math.round((matchedKeywords.length / jobKeywords.size) * 100)
        : 0;

      const interviewScore = interviewScoreMap.get(candidate.id) ?? 0;
      const archetypeTokens = candidate.archetypeName
        ? new Set(toTokens(candidate.archetypeName))
        : new Set<string>();
      const archetypeOverlap = [...jobKeywords].some((token) => archetypeTokens.has(token)) ? 10 : 0;

      // Weights are scaled from existing matching feedback signals.
      const weightedScore = Math.round(
        overlapScore * (0.55 + skillsCountWeight) +
          interviewScore * 0.3 +
          archetypeOverlap * 0.1 +
          (skills.length > 0 ? resumeWeight : 0) +
          coverLetterWeight * 0.5
      );

      const matchScore = Math.max(0, Math.min(100, weightedScore));

      return {
        userId: candidate.id,
        name: candidate.name,
        email: candidate.email,
        avatarUrl: candidate.avatarUrl,
        archetypeName: candidate.archetypeName,
        matchScore,
        avgInterviewScore: interviewScore || null,
        matchedSkills: skills.filter((skill) =>
          matchedKeywords.some((keyword) => toTokens(skill).includes(keyword))
        ),
        skills: skills.slice(0, 8),
        alreadyApplied: false,
        alreadyInvited: false,
      };
    });

    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      job: { id: job.id, title: job.title },
      candidates: scoredCandidates.slice(0, 25),
      total: scoredCandidates.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch matched candidates" },
      { status: 500 }
    );
  }
}
