/**
 * Career Archetyping Engine
 *
 * Orchestrates archetyping from interview feedback: BERT for initial classification,
 * then GPT to generate a rich, personalized career persona. Result saved to user profile.
 */

import "server-only";
import { db } from "@/src/db";
import {
  archetypeReviewQueueTable,
  careerArchetypesTable,
  interviewFeedbackTable,
  interviewSessionsTable,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { classifyArchetype } from "./archetype-bert";
import { generateCompletion } from "./llm";
import {
  ARCHETYPES,
  type ArchetypeDefinition,
  type DimensionKey,
  DIMENSION_LABELS,
} from "./archetypes";

export interface CareerArchetypingResult {
  userId: number;
  archetypeId: string;
  archetypeName: string;
  strengths: string[];
  growthAreas: string[];
  personalizedDescription?: string;
}

/**
 * Run the career archetyping pipeline for a completed interview session.
 * Fetches feedback, classifies via BERT, enriches via LLM, saves to career_archetypes.
 */
export async function runCareerArchetyping(
  sessionId: number
): Promise<CareerArchetypingResult | null> {
  // 1. Fetch feedback and session (userId)
  const [feedbackRow] = await db
    .select({
      content: interviewFeedbackTable.content,
      userId: interviewSessionsTable.userId,
    })
    .from(interviewFeedbackTable)
    .innerJoin(
      interviewSessionsTable,
      eq(interviewFeedbackTable.sessionId, interviewSessionsTable.id)
    )
    .where(eq(interviewFeedbackTable.sessionId, sessionId))
    .limit(1);

  if (!feedbackRow?.content || !feedbackRow?.userId) {
    console.warn(`[career-archetyping] No feedback or session for sessionId ${sessionId}`);
    return null;
  }

  const { content: feedbackContent, userId } = feedbackRow;

  // 2. BERT classification for initial archetype
  let archetypeId: string;
  let baseArchetype: ArchetypeDefinition;

  const bertResult = await classifyArchetype(feedbackContent);

  if (bertResult) {
    archetypeId = bertResult.archetypeId;
    baseArchetype =
      ARCHETYPES.find((a) => a.id === archetypeId) ?? ARCHETYPES[0];
  } else {
    // Fallback: LLM picks archetype when BERT unavailable
    const llmArchetype = await classifyArchetypeViaLLM(feedbackContent);
    archetypeId = llmArchetype?.id ?? "strategist";
    baseArchetype = llmArchetype ?? ARCHETYPES[0];
  }

  // 3. LLM generates personalized strengths and growth areas from interview
  const { strengths, growthAreas, personalizedDescription } =
    await generatePersonalizedPersona(feedbackContent, baseArchetype);

  // 4. Build traits in schema format
  const traits = (Object.keys(baseArchetype.profile) as DimensionKey[]).map(
    (dimension) => ({
      dimension,
      label: DIMENSION_LABELS[dimension],
      score: baseArchetype.profile[dimension] * 3, // raw sum (3 questions × max 5)
      normalized: baseArchetype.profile[dimension],
    })
  );

  // 5. Upsert career_archetypes
  const [upserted] = await db
    .insert(careerArchetypesTable)
    .values({
      userId,
      archetypeName: baseArchetype.name,
      traits,
      strengths,
      growthAreas,
      assessedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: careerArchetypesTable.userId,
      set: {
        archetypeName: baseArchetype.name,
        traits,
        strengths,
        growthAreas,
        assessedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning({ id: careerArchetypesTable.id });

  const careerArchetypeId = upserted?.id;
  if (careerArchetypeId) {
    await db.insert(archetypeReviewQueueTable).values({
      careerArchetypeId,
      sessionId,
      userId,
      feedbackContent,
      aiArchetypeName: baseArchetype.name,
      aiStrengths: strengths,
      aiGrowthAreas: growthAreas,
      status: "pending",
    });
  }

  return {
    userId,
    archetypeId,
    archetypeName: baseArchetype.name,
    strengths,
    growthAreas,
    personalizedDescription,
  };
}

async function classifyArchetypeViaLLM(
  feedbackContent: string
): Promise<ArchetypeDefinition | null> {
  const labels = ARCHETYPES.map((a) => `${a.id}: ${a.name} - ${a.tagline}`).join(
    "\n"
  );

  const { content } = await generateCompletion({
    messages: [
      {
        role: "system",
        content: `You are a career coach. Based on interview feedback, pick the single best-matching career archetype. Reply with ONLY the archetype id (e.g. strategist, innovator, connector, analyst, builder, advocate). No other text.`,
      },
      {
        role: "user",
        content: `Interview feedback:\n\n${feedbackContent.slice(0, 2000)}\n\nArchetypes:\n${labels}\n\nReply with only the archetype id:`,
      },
    ],
    maxTokens: 50,
    temperature: 0.2,
  });

  const id = content?.trim().toLowerCase().replace(/[^a-z]/g, "") ?? "";
  return ARCHETYPES.find((a) => a.id === id) ?? null;
}

async function generatePersonalizedPersona(
  feedbackContent: string,
  baseArchetype: ArchetypeDefinition
): Promise<{
  strengths: string[];
  growthAreas: string[];
  personalizedDescription?: string;
}> {
  const { content } = await generateCompletion({
    messages: [
      {
        role: "system",
        content: `You are a career coach. Based on interview feedback, personalize the career persona for "${baseArchetype.name}" (${baseArchetype.tagline}).

Output valid JSON only, no markdown:
{
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "growthAreas": ["area 1", "area 2", "area 3"],
  "personalizedDescription": "1-2 sentences tailored to this candidate"
}

Use the base archetype as a guide but adapt to what the interview revealed. Keep strengths and growthAreas as short bullet-style phrases.`,
      },
      {
        role: "user",
        content: `Base archetype: ${baseArchetype.name}\nBase strengths: ${baseArchetype.strengths.join("; ")}\nBase growth areas: ${baseArchetype.growthAreas.join("; ")}\n\nInterview feedback:\n\n${feedbackContent.slice(0, 2500)}\n\nOutput JSON:`,
      },
    ],
    maxTokens: 600,
    temperature: 0.5,
  });

  try {
    const json = extractJson(content);
    if (!json) {
      return {
        strengths: baseArchetype.strengths,
        growthAreas: baseArchetype.growthAreas,
      };
    }
    return {
      strengths: Array.isArray(json.strengths)
        ? json.strengths.slice(0, 5).filter((s): s is string => typeof s === "string")
        : baseArchetype.strengths,
      growthAreas: Array.isArray(json.growthAreas)
        ? json.growthAreas.slice(0, 4).filter((s): s is string => typeof s === "string")
        : baseArchetype.growthAreas,
      personalizedDescription:
        typeof json.personalizedDescription === "string"
          ? json.personalizedDescription
          : undefined,
    };
  } catch {
    return {
      strengths: baseArchetype.strengths,
      growthAreas: baseArchetype.growthAreas,
    };
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}
