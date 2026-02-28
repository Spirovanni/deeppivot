import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
    behavioralQuestionsSchema,
    BEHAVIORAL_QUESTIONS_SYSTEM_PROMPT,
    type BehavioralQuestionsResult,
} from "./prompts/behavioral-questions";
import type { JobDescriptionExtraction } from "./prompts/job-descriptions";

const openai = new OpenAI();

/**
 * Generates behavioral interview questions tailored to a job description's
 * company culture, soft-skill requirements, and workplace context.
 *
 * @param extractedData The structured job description data
 * @returns Culture summary + array of tailored behavioral interview questions
 */
export async function generateBehavioralQuestions(
    extractedData: JobDescriptionExtraction
): Promise<BehavioralQuestionsResult> {
    const jobTitle = extractedData.jobTitle ?? "the role";
    const companyName = extractedData.companyName;
    const softSkills = extractedData.softSkillsRequired ?? [];
    const responsibilities = extractedData.primaryResponsibilities ?? [];
    const culture = extractedData.companyCulture;
    const interviewTopics = extractedData.likelyInterviewTopics ?? [];

    if (softSkills.length === 0 && !culture && responsibilities.length === 0) {
        throw new Error(
            "Job description has no soft skills, culture data, or responsibilities to generate behavioral questions from."
        );
    }

    const userPrompt = `Generate behavioral interview questions for the following role:

**Position:** ${jobTitle}
${companyName ? `**Company:** ${companyName}` : ""}

**Company Culture:**
${culture ?? "Not explicitly stated — infer from the soft skills and responsibilities below."}

**Soft Skills Required:**
${softSkills.length > 0 ? softSkills.map((s) => `- ${s}`).join("\n") : "- None explicitly listed"}

**Key Responsibilities:**
${responsibilities.length > 0 ? responsibilities.map((r) => `- ${r}`).join("\n") : "- Not specified"}

**Likely Interview Topics:**
${interviewTopics.length > 0 ? interviewTopics.map((t) => `- ${t}`).join("\n") : "- Not specified"}

Generate questions that specifically assess the candidate's cultural fit and behavioral competencies for this role. Ground each question in the company's culture and the day-to-day realities of the position.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: BEHAVIORAL_QUESTIONS_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            response_format: zodResponseFormat(
                behavioralQuestionsSchema,
                "behavioral_questions"
            ),
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error(
                "Failed to generate behavioral questions (OpenAI returned null content)."
            );
        }

        return JSON.parse(content) as BehavioralQuestionsResult;
    } catch (error) {
        console.error("Error generating behavioral questions via OpenAI:", error);
        throw error;
    }
}
