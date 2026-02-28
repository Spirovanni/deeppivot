import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
    resumeExtractionSchema,
    RESUME_ANALYSIS_SYSTEM_PROMPT,
    type ResumeExtraction
} from "./prompts/resumes";

const openai = new OpenAI();

/**
 * Extracts structured data from raw resume text using OpenAI.
 *
 * @param text The raw text of the resume (pasted or extracted from PDF)
 * @returns A strictly typed ResumeExtraction object
 */
export async function extractResumeData(text: string): Promise<ResumeExtraction> {
    if (!text || text.trim().length === 0) {
        throw new Error("Resume text cannot be empty.");
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: RESUME_ANALYSIS_SYSTEM_PROMPT },
                { role: "user", content: `Please analyze the following resume:\n\n${text}` }
            ],
            response_format: zodResponseFormat(resumeExtractionSchema, "resume_extraction"),
            temperature: 0.1,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("Failed to parse the resume (OpenAI returned null content).");
        }

        const extraction = JSON.parse(content) as ResumeExtraction;

        return extraction;
    } catch (error) {
        console.error("Error extracting resume data via OpenAI:", error);
        throw error;
    }
}
