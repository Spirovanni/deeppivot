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
import {
  getJobKeywords,
  getResumeSkills,
  getResumeSkillTokens,
  parseYearsOfExperience,
  computeSalaryScore,
  computeOverlapScore,
  toTokens,
} from "@/src/lib/matching-scoring";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

type CandidateRow = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  archetypeName: string | null;
  parsedData: ResumeExtraction | null;
};

function toExperienceBand(yearsOfExperience: number | null): string {
  if (yearsOfExperience == null) return "Experience not specified";
  if (yearsOfExperience < 2) return "Early-career profile";
  if (yearsOfExperience < 6) return "Mid-career profile";
  return "Senior profile";
}

function toInterviewBand(score: number | null): string {
  if (score == null) return "No completed interview score yet";
  if (score >= 85) return "Strong interview performance";
  if (score >= 70) return "Solid interview performance";
  return "Developing interview performance";
}

function buildAnonymizedSummary(args: {
  yearsOfExperience: number | null;
  avgInterviewScore: number | null;
  archetypeName: string | null;
  matchedSkills: string[];
}): string {
  const parts: string[] = [toExperienceBand(args.yearsOfExperience), toInterviewBand(args.avgInterviewScore)];
  if (args.archetypeName) {
    parts.push(`Archetype: ${args.archetypeName}`);
  }
  if (args.matchedSkills.length > 0) {
    parts.push(`Skill overlap: ${args.matchedSkills.slice(0, 3).join(", ")}`);
  }
  return parts.join(" • ");
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
        salaryMin: jobsTable.salaryMin,
        salaryMax: jobsTable.salaryMax,
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
    const skillsWeight = Math.max(0, weights.skills_match ?? 0.5);
    const archetypeWeight = Math.max(0, weights.archetype_match ?? 0.2);
    const salaryWeight = Math.max(0, weights.salary_match ?? 0.15);
    const interviewWeight = Math.max(0, weights.interview_score ?? 0.15);
    const totalWeight = Math.max(
      skillsWeight + archetypeWeight + salaryWeight + interviewWeight,
      0.01
    );

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
      const overlapScore = computeOverlapScore(jobKeywords, skillTokens);
      const matchedKeywords = [...jobKeywords].filter((token) => skillTokens.has(token));

      const interviewScore = interviewScoreMap.get(candidate.id) ?? 0;
      const archetypeTokens = candidate.archetypeName
        ? new Set(toTokens(candidate.archetypeName))
        : new Set<string>();
      const archetypeScore = [...jobKeywords].some((token) => archetypeTokens.has(token))
        ? 100
        : candidate.archetypeName
          ? 35
          : 0;
      const yearsOfExperience = parseYearsOfExperience(candidate.parsedData?.yearsOfExperience);
      const salaryScore = computeSalaryScore(job.salaryMin, job.salaryMax, yearsOfExperience);

      // Weighted score model (deeppivot-296): skills + archetype + salary + interview.
      const weightedScore = Math.round(
        (
          overlapScore * skillsWeight +
          archetypeScore * archetypeWeight +
          salaryScore * salaryWeight +
          interviewScore * interviewWeight
        ) / totalWeight
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
        salaryScore,
        yearsOfExperience,
        matchedSkills: skills.filter((skill) =>
          matchedKeywords.some((keyword) => toTokens(skill).includes(keyword))
        ),
        skills: skills.slice(0, 8),
        alreadyApplied: false,
        alreadyInvited: false,
      };
    });

    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    const rankedCandidates = scoredCandidates.slice(0, 25).map((candidate, index) => ({
      ...candidate,
      anonymizedLabel: `Candidate ${index + 1}`,
      anonymizedSummary: buildAnonymizedSummary({
        yearsOfExperience: candidate.yearsOfExperience,
        avgInterviewScore: candidate.avgInterviewScore,
        archetypeName: candidate.archetypeName,
        matchedSkills: candidate.matchedSkills,
      }),
    }));

    return NextResponse.json({
      job: { id: job.id, title: job.title },
      candidates: rankedCandidates,
      total: scoredCandidates.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch matched candidates" },
      { status: 500 }
    );
  }
}
