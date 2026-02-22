/**
 * Predefined career skills for interview-to-skills mapping.
 * Used by the feedback generation service and career plan builder.
 */

import { generateCompletion } from "./llm";

export const CAREER_SKILLS = [
  "Problem Solving",
  "Communication",
  "Leadership",
  "Technical Knowledge",
  "Adaptability",
  "Time Management",
  "Conflict Resolution",
  "Teamwork",
  "Critical Thinking",
  "Emotional Intelligence",
  "Initiative",
  "Attention to Detail",
] as const;

export type CareerSkill = (typeof CAREER_SKILLS)[number];

export interface SkillMapping {
  skill: string;
  score: number; // 0–100
  note?: string;
}

/**
 * Map interview transcript and feedback to career skills via LLM.
 * Returns array of { skill, score (0–100), note? } for use by career plan builder.
 */
export async function mapInterviewToSkills(
  transcript: string,
  feedbackContent: string,
  emotionSummary: string
): Promise<SkillMapping[]> {
  const skillsList = CAREER_SKILLS.join(", ");

  const { content } = await generateCompletion({
    messages: [
      {
        role: "system",
        content: `You are a career coach. Map interview performance to career skills. Output valid JSON only, no markdown:
[
  { "skill": "Problem Solving", "score": 75, "note": "Brief evidence from transcript" },
  ...
]

Skills to evaluate: ${skillsList}
For each skill, give a score 0–100 and an optional short note. Include only skills you can assess from the transcript.`,
      },
      {
        role: "user",
        content: `Interview transcript:\n\n${transcript.slice(0, 3000)}\n\n---\nFeedback summary:\n${feedbackContent.slice(0, 1000)}\n\n---\nEmotional tone: ${emotionSummary}\n\nOutput JSON array of skill mappings:`,
      },
    ],
    maxTokens: 800,
    temperature: 0.3,
  });

  try {
    const json = extractJsonArray(content);
    if (!Array.isArray(json)) return [];

    const valid = json.filter((item): item is Record<string, unknown> => {
      if (!item || typeof item !== "object") return false;
      const o = item as Record<string, unknown>;
      return typeof o.skill === "string" && typeof o.score === "number";
    });

    return valid
      .map((item) => ({
        skill: String(item.skill),
        score: Math.min(100, Math.max(0, Number(item.score))),
        note: typeof item.note === "string" ? item.note : undefined,
      }))
      .slice(0, 12); // Cap at predefined list size
  } catch {
    return [];
  }
}

function extractJsonArray(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as unknown[];
  } catch {
    return null;
  }
}
