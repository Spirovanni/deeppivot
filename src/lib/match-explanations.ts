import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import {
  careerArchetypesTable,
  interviewSessionsTable,
  jobMatchesTable,
  jobsTable,
  userResumesTable,
  usersTable,
} from "@/src/db/schema";
import { generateCompletion } from "@/src/lib/llm";

type MatchExplanationResult = {
  explanation: string;
  matchScore: number;
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3)
  );
}

function buildFallbackExplanation(args: {
  overlapSkills: string[];
  avgInterviewScore: number | null;
  archetypeName: string | null;
  title: string;
}): string {
  const reasons: string[] = [];
  if (args.overlapSkills.length > 0) {
    reasons.push(`your resume overlaps on ${args.overlapSkills.slice(0, 3).join(", ")}`);
  }
  if (args.avgInterviewScore != null) {
    reasons.push(`your recent interview performance is ${args.avgInterviewScore}%`);
  }
  if (args.archetypeName) {
    reasons.push(`your ${args.archetypeName} archetype aligns with role demands`);
  }

  if (reasons.length === 0) {
    return `You match this ${args.title} role based on your profile signals and recent activity.`;
  }

  return `You match this ${args.title} role because ${reasons.slice(0, 2).join(" and ")}.`;
}

function normalizeExplanation(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export async function generateCandidateMatchExplanation(
  clerkUserId: string,
  jobId: number
): Promise<MatchExplanationResult> {
  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (!dbUser) throw new Error("User not found");

  const [matchRow] = await db
    .select({
      matchScore: jobMatchesTable.matchScore,
      title: jobsTable.title,
      description: jobsTable.description,
    })
    .from(jobMatchesTable)
    .innerJoin(jobsTable, eq(jobMatchesTable.jobId, jobsTable.id))
    .where(and(eq(jobMatchesTable.userId, dbUser.id), eq(jobMatchesTable.jobId, jobId), eq(jobsTable.status, "published")))
    .limit(1);

  if (!matchRow) throw new Error("Match not found");

  const [resumeRow] = await db
    .select({
      parsedData: userResumesTable.parsedData,
      rawText: userResumesTable.rawText,
      title: userResumesTable.title,
    })
    .from(userResumesTable)
    .where(eq(userResumesTable.userId, dbUser.id))
    .orderBy(desc(userResumesTable.createdAt))
    .limit(1);

  const [archetypeRow] = await db
    .select({
      archetypeName: careerArchetypesTable.archetypeName,
      strengths: careerArchetypesTable.strengths,
    })
    .from(careerArchetypesTable)
    .where(eq(careerArchetypesTable.userId, dbUser.id))
    .limit(1);

  const [interviewRow] = await db
    .select({
      overallScore: interviewSessionsTable.overallScore,
    })
    .from(interviewSessionsTable)
    .where(and(eq(interviewSessionsTable.userId, dbUser.id), isNull(interviewSessionsTable.deletedAt)))
    .orderBy(desc(interviewSessionsTable.createdAt))
    .limit(1);

  const parsed = (resumeRow?.parsedData ?? {}) as { skills?: string[]; yearsOfExperience?: number | null };
  const resumeSkills = (parsed.skills ?? []).filter(Boolean).slice(0, 12);
  const jobTokens = tokenize(`${matchRow.title} ${matchRow.description}`);
  const overlapSkills = resumeSkills.filter((skill) => {
    const parts = skill.toLowerCase().split(/[\s/]+/).filter((p) => p.length >= 3);
    return parts.some((p) => jobTokens.has(p));
  });
  const avgInterviewScore = interviewRow?.overallScore ?? null;

  const fallback = buildFallbackExplanation({
    overlapSkills,
    avgInterviewScore,
    archetypeName: archetypeRow?.archetypeName ?? null,
    title: matchRow.title,
  });

  try {
    const llm = await generateCompletion({
      temperature: 0.2,
      maxTokens: 120,
      messages: [
        {
          role: "system",
          content:
            "You explain candidate-job fit in plain language. Write 1-2 short sentences, no bullets, no markdown, no hype, no promises. Mention concrete signals only from provided data.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              job: {
                title: matchRow.title,
                descriptionSnippet: matchRow.description.slice(0, 600),
              },
              candidate: {
                resumeTitle: resumeRow?.title ?? null,
                resumeSkills: resumeSkills.slice(0, 8),
                yearsOfExperience: parsed.yearsOfExperience ?? null,
                archetype: archetypeRow?.archetypeName ?? null,
                strengths: (archetypeRow?.strengths ?? []).slice(0, 4),
                latestInterviewScore: avgInterviewScore,
              },
              signals: {
                matchScore: matchRow.matchScore,
                overlapSkills: overlapSkills.slice(0, 5),
              },
            },
            null,
            2
          ),
        },
      ],
    });

    const normalized = normalizeExplanation(llm.content);
    if (!normalized) {
      return { explanation: fallback, matchScore: matchRow.matchScore };
    }

    return { explanation: normalized, matchScore: matchRow.matchScore };
  } catch {
    return { explanation: fallback, matchScore: matchRow.matchScore };
  }
}
