import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
    gapAnalysisSchema,
    GAP_ANALYSIS_SYSTEM_PROMPT,
    type GapAnalysisExtraction
} from "./prompts/gap-analysis";

// Initialize OpenAI client
const openai = new OpenAI();

/**
 * Performs a gap analysis between a parsed resume and a parsed job description.
 * 
 * @param resumeData The parsed JSON data of the candidate's resume
 * @param jobDescriptionData The parsed JSON data of the job description
 * @returns A strictly typed GapAnalysisExtraction object
 */
export async function generateGapAnalysis(
    resumeData: unknown,
    jobDescriptionData: unknown
): Promise<GapAnalysisExtraction> {
    if (!resumeData || !jobDescriptionData) {
        throw new Error("Both resume data and job description data are required.");
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: GAP_ANALYSIS_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Job Description Data:\n${JSON.stringify(jobDescriptionData, null, 2)}\n\nResume Data:\n${JSON.stringify(resumeData, null, 2)}`
                }
            ],
            response_format: zodResponseFormat(gapAnalysisSchema, "gap_analysis_extraction"),
            temperature: 0.1, // Keep it analytical and deterministic
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("Failed to generate gap analysis (OpenAI returned null content).");
        }

        const extraction = JSON.parse(content) as GapAnalysisExtraction;

        return extraction;
    } catch (error) {
        console.error("Error generating gap analysis via OpenAI:", error);
        throw error;
    }
}
