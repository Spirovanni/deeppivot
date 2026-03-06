import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
    coverLetterSchema,
    COVER_LETTER_SYSTEM_PROMPT,
    COVER_LETTER_STREAM_SYSTEM_PROMPT,
    type CoverLetterOutput,
} from "./prompts/cover-letter";
import type { CoverLetterContext } from "@/src/lib/cover-letter/merge-context";

const openai = new OpenAI();

/**
 * Build the user prompt from context + tone. Shared by both generate and stream paths.
 */
export function buildCoverLetterUserPrompt(
    context: CoverLetterContext,
    tone: string = "professional"
): string {
    const candidateIntro = context.candidateName
        ? `**Candidate Name:** ${context.candidateName}`
        : "**Candidate Name:** Not provided";

    return `Generate a cover letter with the following context:

${candidateIntro}
${context.yearsOfExperience ? `**Years of Experience:** ${context.yearsOfExperience}` : ""}

**Target Role:** ${context.jobTitle}
${context.companyName ? `**Company:** ${context.companyName}` : ""}
${context.companyCulture ? `**Company Culture:** ${context.companyCulture}` : ""}

**Key Responsibilities:**
${context.keyResponsibilities.map((r) => `- ${r}`).join("\n")}

**Candidate's Matched Skills:**
${context.matchedSkills.length > 0 ? context.matchedSkills.map((s) => `- ${s}`).join("\n") : "- None identified"}

**Skill Gaps (don't highlight, frame positively if relevant):**
${context.skillGaps.length > 0 ? context.skillGaps.map((s) => `- ${s}`).join("\n") : "- None"}

**Relevant Experience Highlights:**
${context.relevantExperience.length > 0 ? context.relevantExperience.map((e) => `- ${e}`).join("\n") : "- No specific highlights available"}

**Desired Tone:** ${tone}`;
}

/**
 * Generates a cover letter from merged JD + resume context.
 *
 * @param context The merged cover letter context (matched skills, gaps, experience)
 * @param tone The desired tone: "professional" | "conversational" | "enthusiastic"
 * @returns A structured cover letter with subject and body
 */
export async function generateCoverLetter(
    context: CoverLetterContext,
    tone: string = "professional"
): Promise<CoverLetterOutput> {
    const userPrompt = buildCoverLetterUserPrompt(context, tone);

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: COVER_LETTER_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            response_format: zodResponseFormat(
                coverLetterSchema,
                "cover_letter"
            ),
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error(
                "Failed to generate cover letter (OpenAI returned null content)."
            );
        }

        return JSON.parse(content) as CoverLetterOutput;
    } catch (error) {
        console.error("Error generating cover letter via OpenAI:", error);
        throw error;
    }
}

/**
 * Streams a cover letter token-by-token. Returns a ReadableStream that emits
 * plain text chunks. The stream uses a plain-text system prompt (no JSON schema)
 * so tokens arrive as human-readable text immediately.
 */
export function streamCoverLetter(
    context: CoverLetterContext,
    tone: string = "professional"
): ReadableStream<Uint8Array> {
    const userPrompt = buildCoverLetterUserPrompt(context, tone);
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                const stream = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: COVER_LETTER_STREAM_SYSTEM_PROMPT },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.7,
                    stream: true,
                });

                for await (const chunk of stream) {
                    const delta = chunk.choices[0]?.delta?.content;
                    if (delta) {
                        controller.enqueue(encoder.encode(delta));
                    }
                }

                controller.close();
            } catch (error) {
                console.error("Error streaming cover letter:", error);
                controller.error(error);
            }
        },
    });
}
