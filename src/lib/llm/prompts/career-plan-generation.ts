import { z } from "zod";

/**
 * Zod schema defining the structured JSON output for AI-generated career plans.
 */
export const generatedMilestoneSchema = z.object({
  title: z
    .string()
    .describe(
      "A concise, action-oriented milestone title (e.g. 'Master React Testing Library', 'Earn AWS Cloud Practitioner Certification')."
    ),
  description: z
    .string()
    .describe(
      "2-3 sentence description of what completing this milestone involves and why it matters for the career transition."
    ),
  targetWeeksFromNow: z
    .number()
    .min(1)
    .max(52)
    .describe(
      "Recommended number of weeks from today to complete this milestone."
    ),
  suggestedResources: z
    .array(
      z.object({
        title: z.string().describe("Resource name."),
        url: z.string().describe("URL to the resource."),
        resourceType: z
          .string()
          .describe(
            "Type: article, course, video, book, tool, or certification."
          ),
      })
    )
    .max(3)
    .optional()
    .default([])
    .describe("1-3 relevant learning resources for this milestone."),
});

export const careerPlanGenerationSchema = z.object({
  planSummary: z
    .string()
    .optional()
    .default("")
    .describe(
      "A 2-3 sentence summary of the overall career plan strategy."
    ),
  plan_summary: z.string().optional(),
  summary: z.string().optional(),
  milestones: z
    .array(generatedMilestoneSchema)
    .min(1)
    .max(12)
    .describe(
      "5-8 ordered career milestones forming a progressive path from current state to target role."
    ),
}).transform((data) => ({
  // Normalize: LLM might use different key names for summary
  planSummary: data.planSummary || data.plan_summary || data.summary || "",
  milestones: data.milestones,
}));

export type GeneratedCareerPlan = z.infer<typeof careerPlanGenerationSchema>;
export type GeneratedMilestone = z.infer<typeof generatedMilestoneSchema>;

/**
 * System prompt guiding the LLM to generate a personalized career plan.
 */
export const CAREER_PLAN_GENERATION_SYSTEM_PROMPT = `
You are an expert Career Transition Coach and Strategic Planner.
Your task is to create a personalized, actionable career development plan that bridges the gap between a candidate's current profile and their target role.

CONTEXT YOU WILL RECEIVE:
1. Candidate Profile — skills, work experience, education, certifications
2. Target Role — required technical and soft skills, responsibilities
3. Skill Gap Analysis — which skills match and which are missing
4. Career Archetype — personality-based strengths and growth areas (may be absent)
5. Interview Performance — skill scores and feedback from practice sessions (may be absent)
6. Available Education Programs — courses, bootcamps, certifications the candidate can enroll in (may be absent)

MILESTONE GENERATION PRINCIPLES:
1. Progressive Difficulty: Start with quick wins that leverage existing strengths, then build toward gap-closing activities, and end with job-readiness milestones.
2. Realistic Timing: Space milestones 2-8 weeks apart. Total plan should span 3-9 months.
3. Actionable Specificity: Each milestone must have a clear completion criteria. Avoid vague goals like "improve skills."
4. Gap Coverage: Ensure missing skills from the gap analysis are addressed.
5. Strength Amplification: Include milestones that deepen existing strengths relevant to the target role.
6. Archetype Alignment: If an archetype is provided, leverage its strengths (e.g. a "Connector" should have networking milestones).
7. Interview Readiness: Include at least one milestone for interview preparation, informed by past performance data if available.
8. Resource Relevance: When suggesting resources, prefer programs from the provided education catalog when they match. Include real, well-known resource URLs.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "planSummary": "2-3 sentence strategy overview",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "2-3 sentence description",
      "targetWeeksFromNow": 4,
      "suggestedResources": [
        { "title": "Resource name", "url": "https://...", "resourceType": "course" }
      ]
    }
  ]
}

Generate 5-8 milestones ordered from first to last.
Each milestone needs a targetWeeksFromNow (integer, 1-52) relative to today.
Each milestone MUST include a "suggestedResources" array (can be empty []).
The top-level "planSummary" field is REQUIRED.

DO NOT:
- Fabricate skills or experience the candidate does not have
- Generate vague milestones like "improve skills" or "learn more"
- Ignore the candidate's archetype strengths when planning
- Suggest milestones irrelevant to the target role
`;
