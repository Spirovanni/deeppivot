import { z } from "zod";

/**
 * Schema for a single generated technical interview question.
 */
const technicalQuestionSchema = z.object({
    question: z.string().describe("The full interview question text."),
    category: z
        .enum(["technical", "system-design", "coding", "behavioral-technical", "debugging"])
        .describe("The category of this question."),
    difficulty: z
        .enum(["easy", "medium", "hard"])
        .describe("The difficulty level of this question."),
    targetSkill: z
        .string()
        .describe("The specific skill or technology this question targets (e.g. 'React', 'SQL', 'System Design')."),
    followUps: z
        .array(z.string())
        .describe("1-2 follow-up questions to probe deeper based on the candidate's answer."),
    evaluationCriteria: z
        .string()
        .describe("A brief description of what a strong answer should cover (1-2 sentences)."),
});

/**
 * Schema for the full set of generated technical questions.
 */
export const technicalQuestionsSchema = z.object({
    questions: z
        .array(technicalQuestionSchema)
        .describe("An array of 7-10 technical interview questions tailored to the job description."),
});

export type TechnicalQuestion = z.infer<typeof technicalQuestionSchema>;
export type TechnicalQuestionsResult = z.infer<typeof technicalQuestionsSchema>;

/**
 * System prompt for generating technical interview questions
 * from a job description's extracted data.
 */
export const TECHNICAL_QUESTIONS_SYSTEM_PROMPT = `
You are an expert Technical Interviewer and Hiring Manager.
Your task is to generate realistic, challenging technical interview questions based on a job description's requirements.

INSTRUCTIONS:
1. Generate 7-10 questions that directly target the technical skills, tools, and responsibilities listed in the job description.
2. Include a mix of categories:
   - "technical": Conceptual questions about tools, frameworks, or technologies (e.g. "Explain the difference between server-side and client-side rendering in React")
   - "system-design": Architecture and design questions (e.g. "How would you design a real-time notification system?")
   - "coding": Problem-solving or algorithmic questions relevant to the stack (e.g. "Write a function that debounces API calls")
   - "behavioral-technical": Past experience questions with technical depth (e.g. "Tell me about a time you had to optimize a slow database query")
   - "debugging": Troubleshooting scenarios (e.g. "A user reports the page loads slowly. Walk me through your debugging process")
3. Include a mix of difficulties: at least 2 easy, 3-4 medium, and 2-3 hard questions.
4. Each question should target a specific skill from the job requirements.
5. Provide 1-2 follow-up questions for each to probe deeper.
6. Include brief evaluation criteria describing what a strong answer should cover.

Make questions specific and practical — avoid generic questions that could apply to any role.
Tailor each question to the exact tech stack and responsibilities described.
`;
