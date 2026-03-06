import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
    jobDescriptionExtractionSchema,
    JOB_DESCRIPTION_ANALYSIS_SYSTEM_PROMPT,
    type JobDescriptionExtraction
} from "./prompts/job-descriptions";

// Initialize OpenAI client
// It automatically uses process.env.OPENAI_API_KEY
const openai = new OpenAI();

/**
 * Extracts structured data from a raw job description using OpenAI.
 * 
 * @param text The raw text of the job description (pasted or extracted from PDF)
 * @returns A strictly typed JobDescriptionExtraction object
 */
export async function extractJobDescriptionData(text: string): Promise<JobDescriptionExtraction> {
    if (!text || text.trim().length === 0) {
        throw new Error("Job description text cannot be empty.");
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: JOB_DESCRIPTION_ANALYSIS_SYSTEM_PROMPT },
                { role: "user", content: `Please analyze the following job description:\n\n${text}` }
            ],
            response_format: zodResponseFormat(jobDescriptionExtractionSchema, "job_description_extraction"),
            temperature: 0.1, // Keep it precise and deterministic
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("Failed to parse the job description (OpenAI returned null content).");
        }

        const extraction = JSON.parse(content) as JobDescriptionExtraction;

        return extraction;
    } catch (error) {
        console.error("Error extracting job description data via OpenAI:", error);
        throw error;
    }
}
