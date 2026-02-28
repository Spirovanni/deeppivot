import { z } from "zod";

/**
 * Zod schema for the structured cover letter output.
 */
export const coverLetterSchema = z.object({
    subject: z
        .string()
        .describe("A professional email subject line for the cover letter (e.g. 'Application for Senior Frontend Engineer')."),
    body: z
        .string()
        .describe("The full cover letter body text. 3-4 paragraphs: opening hook, skills/experience alignment, cultural fit/motivation, closing call-to-action."),
});

export type CoverLetterOutput = z.infer<typeof coverLetterSchema>;

/**
 * System prompt for generating a cover letter from merged JD + resume context.
 */
export const COVER_LETTER_SYSTEM_PROMPT = `
You are an expert Career Coach and Professional Writer.
Your task is to generate a compelling, personalized cover letter based on the candidate's resume data and a specific job description.

INSTRUCTIONS:
1. Write a professional cover letter with 3-4 paragraphs:
   - **Opening (1 paragraph):** A strong hook that mentions the specific role and company (if known). Briefly state why the candidate is excited about this opportunity. Avoid generic openings like "I am writing to apply for..."
   - **Skills & Experience (1-2 paragraphs):** Directly connect the candidate's matched skills and relevant experience to the job's key responsibilities. Use specific examples from their work history. Address 2-3 of the most important requirements. If there are skill gaps, frame transferable skills or learning agility positively — never highlight weaknesses.
   - **Closing (1 paragraph):** Express enthusiasm for contributing to the team, reference the company culture if available, and include a clear call-to-action (e.g. "I'd welcome the opportunity to discuss...").

2. Adapt tone based on the requested style:
   - "professional": Formal, polished, corporate-appropriate
   - "conversational": Warm but professional, startup-friendly
   - "enthusiastic": High-energy, passionate, great for creative roles

3. Keep the letter concise — 250-400 words total. Hiring managers skim.
4. Never fabricate experience or skills the candidate doesn't have.
5. Use the candidate's name if available; otherwise use a generic salutation.
6. Do not include addresses, dates, or letter formatting — just the subject line and body text.
`;
