import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
    answerRelevanceSchema,
    ANSWER_RELEVANCE_SYSTEM_PROMPT,
    type AnswerRelevanceResult,
} from "./prompts/answer-relevance";
import type { JobDescriptionExtraction } from "./prompts/job-descriptions";

const openai = new OpenAI();

interface QAPair {
    question: string;
    answer: string;
}

/**
 * Rates how well a candidate's interview answers align with a specific
 * job description's requirements.
 *
 * @param extractedData The structured job description data
 * @param qaPairs Array of question-answer pairs from the interview
 * @returns Structured relevance evaluation with scores and feedback
 */
export async function rateAnswerRelevance(
    extractedData: JobDescriptionExtraction,
    qaPairs: QAPair[]
): Promise<AnswerRelevanceResult> {
    if (qaPairs.length === 0) {
        throw new Error("No question-answer pairs provided for evaluation.");
    }

    const jobTitle = extractedData.jobTitle ?? "the role";
    const technicalSkills = extractedData.technicalSkillsRequired ?? [];
    const softSkills = extractedData.softSkillsRequired ?? [];
    const responsibilities = extractedData.primaryResponsibilities ?? [];
    const interviewTopics = extractedData.likelyInterviewTopics ?? [];
    const yearsOfExperience = extractedData.yearsOfExperience;

    const jobContext = `## Job Description Requirements

**Position:** ${jobTitle}
${yearsOfExperience ? `**Experience Level:** ${yearsOfExperience}` : ""}

**Technical Skills Required:**
${technicalSkills.map((s) => `- ${s}`).join("\n")}

**Soft Skills Required:**
${softSkills.map((s) => `- ${s}`).join("\n")}

**Key Responsibilities:**
${responsibilities.map((r) => `- ${r}`).join("\n")}

**Likely Interview Topics:**
${interviewTopics.map((t) => `- ${t}`).join("\n")}`;

    const qaText = qaPairs
        .map(
            (qa, i) =>
                `### Q${i + 1}: ${qa.question}\n**Candidate's Answer:** ${qa.answer}`
        )
        .join("\n\n");

    const userPrompt = `${jobContext}

---

## Interview Transcript

${qaText}

---

Evaluate each answer's relevance to the job description above and provide an overall assessment.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: ANSWER_RELEVANCE_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            response_format: zodResponseFormat(
                answerRelevanceSchema,
                "answer_relevance"
            ),
            temperature: 0.3, // Precise evaluation
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error(
                "Failed to rate answer relevance (OpenAI returned null content)."
            );
        }

        return JSON.parse(content) as AnswerRelevanceResult;
    } catch (error) {
        console.error("Error rating answer relevance via OpenAI:", error);
        throw error;
    }
}
