import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
    technicalQuestionsSchema,
    TECHNICAL_QUESTIONS_SYSTEM_PROMPT,
    type TechnicalQuestionsResult,
} from "./prompts/technical-questions";
import type { JobDescriptionExtraction } from "./prompts/job-descriptions";

const openai = new OpenAI();

/**
 * Generates technical interview questions tailored to a job description's
 * extracted data (tech stack, skills, responsibilities).
 *
 * @param extractedData The structured job description data
 * @returns An array of tailored technical interview questions
 */
export async function generateTechnicalQuestions(
    extractedData: JobDescriptionExtraction
): Promise<TechnicalQuestionsResult> {
    const jobTitle = extractedData.jobTitle ?? "the role";
    const technicalSkills = extractedData.technicalSkillsRequired ?? [];
    const softSkills = extractedData.softSkillsRequired ?? [];
    const responsibilities = extractedData.primaryResponsibilities ?? [];
    const interviewTopics = extractedData.likelyInterviewTopics ?? [];
    const yearsOfExperience = extractedData.yearsOfExperience;

    if (technicalSkills.length === 0 && responsibilities.length === 0) {
        throw new Error(
            "Job description has no technical skills or responsibilities to generate questions from."
        );
    }

    const userPrompt = `Generate technical interview questions for the following role:

**Position:** ${jobTitle}
${yearsOfExperience ? `**Experience Level:** ${yearsOfExperience}` : ""}

**Technical Skills Required:**
${technicalSkills.map((s) => `- ${s}`).join("\n")}

**Soft Skills Required:**
${softSkills.map((s) => `- ${s}`).join("\n")}

**Key Responsibilities:**
${responsibilities.map((r) => `- ${r}`).join("\n")}

**Likely Interview Topics:**
${interviewTopics.map((t) => `- ${t}`).join("\n")}

Generate questions that specifically test these skills and responsibilities.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: TECHNICAL_QUESTIONS_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            response_format: zodResponseFormat(
                technicalQuestionsSchema,
                "technical_questions"
            ),
            temperature: 0.7, // Allow some creativity in question formulation
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error(
                "Failed to generate questions (OpenAI returned null content)."
            );
        }

        return JSON.parse(content) as TechnicalQuestionsResult;
    } catch (error) {
        console.error("Error generating technical questions via OpenAI:", error);
        throw error;
    }
}
