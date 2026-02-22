/**
 * Predictive Career Analytics Service
 *
 * Analyzes a user's combined data (archetype, skills, plan goals, interview performance)
 * and uses an LLM to generate predictive insights.
 */

import "server-only";
import { db } from "@/src/db";
import {
  usersTable,
  careerArchetypesTable,
  careerMilestonesTable,
  interviewSessionsTable,
  interviewFeedbackTable,
} from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateCompletion } from "./llm";

export interface UserCareerContext {
  archetype: {
    name: string;
    strengths: string[];
    growthAreas: string[];
  } | null;
  skills: Array<{ skill: string; score: number; note?: string }>;
  planGoals: Array<{ title: string; description: string | null; status: string }>;
  interviewPerformance: {
    totalSessions: number;
    completedSessions: number;
    recentScores: (number | null)[];
    feedbackSummaries: string[];
  };
}

export interface PredictiveInsight {
  type: "skill" | "career_path" | "goal";
  title: string;
  description: string;
}

/**
 * Fetch aggregated career context for a user.
 */
export async function fetchUserCareerContext(
  userId: number
): Promise<UserCareerContext> {
  const [archetype, milestones, sessionsWithFeedback] = await Promise.all([
    db
      .select({
        archetypeName: careerArchetypesTable.archetypeName,
        strengths: careerArchetypesTable.strengths,
        growthAreas: careerArchetypesTable.growthAreas,
      })
      .from(careerArchetypesTable)
      .where(eq(careerArchetypesTable.userId, userId))
      .limit(1),
    db
      .select({
        title: careerMilestonesTable.title,
        description: careerMilestonesTable.description,
        status: careerMilestonesTable.status,
      })
      .from(careerMilestonesTable)
      .where(eq(careerMilestonesTable.userId, userId))
      .orderBy(careerMilestonesTable.orderIndex),
    db
      .select({
        sessionId: interviewSessionsTable.id,
        sessionType: interviewSessionsTable.sessionType,
        overallScore: interviewSessionsTable.overallScore,
        status: interviewSessionsTable.status,
        feedbackContent: interviewFeedbackTable.content,
        skillsMapping: interviewFeedbackTable.skillsMapping,
      })
      .from(interviewSessionsTable)
      .leftJoin(
        interviewFeedbackTable,
        eq(interviewFeedbackTable.sessionId, interviewSessionsTable.id)
      )
      .where(eq(interviewSessionsTable.userId, userId))
      .orderBy(desc(interviewSessionsTable.startedAt))
      .limit(10),
  ]);

  const arch = archetype[0];
  const skillsMap = new Map<string, { score: number; note?: string }>();
  const feedbackSummaries: string[] = [];

  for (const row of sessionsWithFeedback) {
    if (row.feedbackContent) {
      feedbackSummaries.push(
        row.feedbackContent.slice(0, 300) + (row.feedbackContent.length > 300 ? "…" : "")
      );
    }
    const mapping = row.skillsMapping as Array<{ skill: string; score: number; note?: string }> | null;
    if (Array.isArray(mapping)) {
      for (const m of mapping) {
        if (m?.skill && typeof m.score === "number") {
          const existing = skillsMap.get(m.skill);
          if (!existing || m.score > existing.score) {
            skillsMap.set(m.skill, { score: m.score, note: m.note });
          }
        }
      }
    }
  }

  const skills = Array.from(skillsMap.entries()).map(([skill, { score, note }]) => ({
    skill,
    score,
    note,
  }));

  const completedSessions = sessionsWithFeedback.filter((s) => s.status === "completed");
  const recentScores = completedSessions
    .map((s) => s.overallScore)
    .filter((v): v is number => v !== null);

  return {
    archetype: arch
      ? {
          name: arch.archetypeName,
          strengths: arch.strengths ?? [],
          growthAreas: arch.growthAreas ?? [],
        }
      : null,
    skills,
    planGoals: milestones.map((m) => ({
      title: m.title,
      description: m.description,
      status: m.status,
    })),
    interviewPerformance: {
      totalSessions: sessionsWithFeedback.length,
      completedSessions: completedSessions.length,
      recentScores,
      feedbackSummaries,
    },
  };
}

function buildContextSummary(ctx: UserCareerContext): string {
  const parts: string[] = [];

  if (ctx.archetype) {
    parts.push(
      `Career Archetype: ${ctx.archetype.name}`,
      `Strengths: ${ctx.archetype.strengths.join(", ") || "None"}`,
      `Growth areas: ${ctx.archetype.growthAreas.join(", ") || "None"}`
    );
  } else {
    parts.push("Career Archetype: Not yet assessed");
  }

  if (ctx.skills.length > 0) {
    const skillList = ctx.skills
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => `${s.skill} (${s.score}/100)${s.note ? `: ${s.note}` : ""}`)
      .join("\n");
    parts.push("Skills from interviews:\n" + skillList);
  } else {
    parts.push("Skills: No interview feedback yet");
  }

  if (ctx.planGoals.length > 0) {
    const goals = ctx.planGoals
      .map((g) => `- ${g.title} (${g.status})${g.description ? `: ${g.description.slice(0, 80)}` : ""}`)
      .join("\n");
    parts.push("Career plan goals:\n" + goals);
  } else {
    parts.push("Career plan: No milestones yet");
  }

  const perf = ctx.interviewPerformance;
  parts.push(
    `Interview performance: ${perf.completedSessions} completed of ${perf.totalSessions} total`,
    perf.recentScores.length > 0
      ? `Recent scores: ${perf.recentScores.slice(0, 5).join(", ")}`
      : "No scores yet"
  );

  if (perf.feedbackSummaries.length > 0) {
    parts.push("Recent feedback excerpts:\n" + perf.feedbackSummaries.slice(0, 2).join("\n---\n"));
  }

  return parts.join("\n\n");
}

/**
 * Generate predictive career insights using an LLM.
 */
export async function generatePredictiveInsights(
  context: UserCareerContext
): Promise<PredictiveInsight[]> {
  const contextSummary = buildContextSummary(context);

  const { content } = await generateCompletion({
    messages: [
      {
        role: "system",
        content: `You are a career coach. Based on the user's data, generate 2–4 short, actionable predictive insights.

Output format (one per line, use exactly this structure):
SKILL|Recommended next skill to learn|Brief reason (1 sentence)
PATH|Potential career path to explore|Brief reason (1 sentence)
GOAL|Suggested next goal for their plan|Brief reason (1 sentence)

Examples:
SKILL|Technical Knowledge|Your interview feedback shows room to grow in technical depth.
PATH|Product Management|Your archetype strengths align well with PM roles.
GOAL|Complete 3 more behavioral interviews|Practice will strengthen your STAR storytelling.

Generate only lines in the format above. No other text.`,
      },
      {
        role: "user",
        content: `User career context:\n\n${contextSummary}\n\nGenerate 2–4 predictive insights.`,
      },
    ],
    maxTokens: 500,
    temperature: 0.6,
  });

  const insights: PredictiveInsight[] = [];
  const lines = content.trim().split("\n").filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^(SKILL|PATH|GOAL)\|([^|]+)\|(.+)$/);
    if (match) {
      const [, type, title, description] = match;
      insights.push({
        type: type.toLowerCase() as "skill" | "career_path" | "goal",
        title: title.trim(),
        description: description.trim(),
      });
    }
  }

  return insights.slice(0, 4);
}
