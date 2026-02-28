import { z } from "zod";

/**
 * Zod schema defining the EXACT structured JSON output we want
 * the LLM to produce when analyzing a raw Job Description.
 */
export const jobDescriptionExtractionSchema = z.object({
    jobTitle: z.string().describe("The official title of the position being hired for."),
    companyName: z.string().nullable().describe("The name of the company hiring, if mentioned."),

    // Hard Requirements
    technicalSkillsRequired: z.array(z.string()).describe("List of concrete technical skills, tools, or frameworks required (e.g., React, Python, AWS)."),
    softSkillsRequired: z.array(z.string()).describe("List of interpersonal or soft skills required (e.g., Leadership, Communication)."),
    yearsOfExperience: z.string().nullable().describe("The required years of experience (e.g., '3-5 years', '5+', or null if not stated)."),

    // Contextual Data
    primaryResponsibilities: z.array(z.string()).describe("The 3-5 core day-to-day responsibilities of the role."),
    companyCulture: z.string().nullable().describe("A 1-2 sentence summary of the company culture or working environment based on the text."),

    // Interview Prep Hooks
    likelyInterviewTopics: z.array(z.string()).describe("Based on the job description, 3-5 specific technical or behavioral topics the candidate is most likely to be grilled on during an interview."),
});

// Infer TypeScript type from schema
export type JobDescriptionExtraction = z.infer<typeof jobDescriptionExtractionSchema>;

/**
 * The system prompt to guide the LLM's behavior as an expert
 * technical recruiter parsing the input document.
 */
export const JOB_DESCRIPTION_ANALYSIS_SYSTEM_PROMPT = `
You are an expert Technical Recruiter and Career Coach. 
Your task is to analyze raw text extracted from a job description (either copy-pasted or from a PDF) and extract the core requirements into a highly structured JSON format.

INSTRUCTIONS:
1. Carefully extract the concrete technical and soft skills required for the role. Be concise. Extract tools by their common names (e.g. "React" instead of "Experience with React").
2. Identify the primary day-to-day responsibilities.
3. Determine the expected years of experience.
4. Synthesize the company culture if it is mentioned.
5. Anticipate the likely interview topics. If this is a Frontend role, they might be asked about state management. If it's a Backend role, databases and API design. Be specific to the JD.

If a piece of information (like company name or culture) is missing from the text, return null for that field rather than guessing. 
Do not include fluff or marketing text in the extracted lists. Stick to the pragmatic requirements.
`;
