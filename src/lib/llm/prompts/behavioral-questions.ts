import { z } from "zod";

/**
 * Schema for a single generated behavioral interview question
 * derived from a job description's culture and soft-skill signals.
 */
const behavioralQuestionSchema = z.object({
    question: z
        .string()
        .describe("The full behavioral interview question text, phrased using STAR-friendly language (e.g. 'Tell me about a time when…')."),
    category: z
        .enum([
            "teamwork",
            "leadership",
            "conflict-resolution",
            "adaptability",
            "communication",
            "problem-solving",
            "culture-fit",
            "initiative",
        ])
        .describe("The behavioral competency this question targets."),
    culturalSignal: z
        .string()
        .describe("The specific company-culture trait or value this question is designed to assess (e.g. 'fast-paced, iterative environment')."),
    followUps: z
        .array(z.string())
        .describe("1-2 follow-up probes to deepen the candidate's response."),
    evaluationCriteria: z
        .string()
        .describe("What a strong answer should demonstrate (1-2 sentences)."),
});

/**
 * Schema for the full set of generated behavioral questions.
 */
export const behavioralQuestionsSchema = z.object({
    questions: z
        .array(behavioralQuestionSchema)
        .describe("An array of 7-10 behavioral interview questions tailored to the job description's culture and soft-skill requirements."),
    cultureSummary: z
        .string()
        .describe("A 2-3 sentence summary of the company culture inferred from the job description, used to ground the questions."),
});

export type BehavioralQuestion = z.infer<typeof behavioralQuestionSchema>;
export type BehavioralQuestionsResult = z.infer<typeof behavioralQuestionsSchema>;

/**
 * System prompt for generating behavioral interview questions
 * that are specifically grounded in a job description's culture signals.
 */
export const BEHAVIORAL_QUESTIONS_SYSTEM_PROMPT = `
You are an expert Behavioral Interviewer and Organizational Psychologist.
Your task is to generate realistic, insightful behavioral interview questions based on a job description's cultural signals, soft-skill requirements, and workplace context.

INSTRUCTIONS:
1. First, synthesize the company culture from all available signals: explicit culture statements, soft-skill requirements, responsibilities that imply teamwork/autonomy/pace, and any environmental clues.
2. Generate 7-10 behavioral questions that probe the candidate's alignment with this culture.
3. Every question MUST use the "Tell me about a time…" or "Describe a situation where…" stem to invite STAR-method responses.
4. Include a mix of categories:
   - "teamwork": Collaboration, cross-functional work, supporting colleagues
   - "leadership": Influencing without authority, mentoring, driving initiatives
   - "conflict-resolution": Handling disagreements, difficult stakeholders, competing priorities
   - "adaptability": Navigating change, ambiguity, shifting priorities
   - "communication": Explaining complex ideas, stakeholder updates, written/verbal clarity
   - "problem-solving": Resourcefulness, analytical thinking in non-technical contexts
   - "culture-fit": Questions directly targeting the company's stated values or work style
   - "initiative": Going beyond the role, self-starting, proactive improvement
5. For each question, identify the specific cultural signal it addresses.
6. Provide 1-2 follow-up probes and brief evaluation criteria.

IMPORTANT:
- Ground every question in the specific job description context — avoid generic behavioral questions.
- If the company culture is collaborative, ask about collaboration. If it prizes autonomy, ask about self-direction.
- Reference the job's actual responsibilities when framing scenarios.
- Keep questions concise and conversational — they will be asked by a voice AI interviewer.
`;
