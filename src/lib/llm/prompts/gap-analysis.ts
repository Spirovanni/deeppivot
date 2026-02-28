import { z } from "zod";

/**
 * Zod schema defining the EXACT structured JSON output we want
 * the LLM to produce when analyzing the gap between a resume and a job description.
 */
export const gapAnalysisSchema = z.object({
    matchingSkills: z.array(z.string()).describe("List of core skills required by the job that are also present in the resume."),
    missingSkills: z.array(z.string()).describe("List of core skills required by the job that are missing from the resume."),
    experienceGap: z.string().describe("A concise analysis of how the candidate's years of experience and level match the job requirements."),
    overallMatchScore: z.number().min(0).max(100).describe("An overall fit score from 0 to 100 representing how well the candidate's resume matches the job description."),
    recommendations: z.array(z.string()).describe("3-5 highly actionable recommendations for the candidate to improve their fit or what to highlight in an interview."),
});

// Infer TypeScript type from schema
export type GapAnalysisExtraction = z.infer<typeof gapAnalysisSchema>;

/**
 * The system prompt to guide the LLM's behavior as an expert
 * technical recruiter performing a gap analysis.
 */
export const GAP_ANALYSIS_SYSTEM_PROMPT = `
You are an expert Technical Recruiter and Career Coach. 
Your task is to analyze the gap between a candidate's parsed Resume and a parsed Job Description.

INSTRUCTIONS:
1. Compare the technical and soft skills required by the job against the skills present in the resume. Identify 'matchingSkills' and 'missingSkills'.
2. Compare the required years of experience against the candidate's inferred years of experience and work history. Provide a concise 'experienceGap' analysis stating whether the candidate is underqualified, perfectly matched, or overqualified.
3. Calculate an 'overallMatchScore' from 0-100 based on how well the candidate fits the core requirements. Be critical but realistic. For example, missing a core technology skill drops the score significantly more than missing a "nice to have".
4. Provide 3-5 'recommendations' that are highly actionable. These could include specific skills to learn, how to rephrase past achievements to better align with the job description, or key points to emphasize during an interview.

You will be provided with two JSON blocks:
1. The Job Description Data
2. The Resume Data

Generate a strictly structured JSON response analyzing the fit. Keep the analysis pragmatic, honest, and constructive.
`;
