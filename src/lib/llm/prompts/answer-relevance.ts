import { z } from "zod";

/**
 * Schema for rating a single answer's relevance to a job description.
 */
const answerRelevanceItemSchema = z.object({
    questionSummary: z
        .string()
        .describe("A brief 1-sentence summary of the question being evaluated."),
    relevanceScore: z
        .number()
        .min(0)
        .max(100)
        .describe("How relevant the candidate's answer is to the job description requirements (0-100)."),
    alignedSkills: z
        .array(z.string())
        .describe("Which job-required skills or responsibilities the answer demonstrates."),
    missingSkills: z
        .array(z.string())
        .describe("Which job-required skills or responsibilities the answer fails to address."),
    feedback: z
        .string()
        .describe("1-2 sentences of specific, actionable feedback on how to better tailor the answer to this job."),
});

/**
 * Schema for the full relevance evaluation of an interview session.
 */
export const answerRelevanceSchema = z.object({
    overallRelevanceScore: z
        .number()
        .min(0)
        .max(100)
        .describe("Overall relevance score across all answers (0-100). Weighted average considering question importance."),
    summary: z
        .string()
        .describe("A 2-3 sentence executive summary of how well the candidate's answers align with the job requirements."),
    topStrengths: z
        .array(z.string())
        .describe("Top 2-3 areas where the candidate's answers strongly aligned with JD requirements."),
    criticalGaps: z
        .array(z.string())
        .describe("Top 2-3 job requirements that were poorly addressed or missing from answers entirely."),
    perQuestion: z
        .array(answerRelevanceItemSchema)
        .describe("Per-question relevance evaluation."),
});

export type AnswerRelevanceItem = z.infer<typeof answerRelevanceItemSchema>;
export type AnswerRelevanceResult = z.infer<typeof answerRelevanceSchema>;

/**
 * System prompt for evaluating answer relevance against a job description.
 */
export const ANSWER_RELEVANCE_SYSTEM_PROMPT = `
You are an expert Interview Evaluator specializing in job-fit assessment.
Your task is to evaluate how well a candidate's interview answers align with a specific job description's requirements.

INSTRUCTIONS:
1. For each question-answer pair, assess how directly the answer addresses the skills, tools, and responsibilities required by the job description.
2. A high relevance score (80-100) means the answer directly demonstrates required skills with specific examples.
3. A medium score (50-79) means the answer is partially relevant but misses key requirements or lacks specificity.
4. A low score (0-49) means the answer is generic, off-topic, or fails to address critical job requirements.
5. Identify which required skills each answer demonstrates and which it misses.
6. Provide actionable feedback — tell the candidate exactly what to include to better match the job.
7. Weight the overall score by question importance: questions targeting core technical skills and primary responsibilities matter more than peripheral topics.

Be precise and constructive. Reference specific skills and responsibilities from the job description in your evaluation.
`;
