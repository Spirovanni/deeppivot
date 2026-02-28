import { z } from "zod";

/**
 * Zod schema defining the structured JSON output we want
 * the LLM to produce when analyzing a raw resume.
 */
export const resumeExtractionSchema = z.object({
    fullName: z.string().describe("The candidate's full name."),
    email: z.string().nullable().describe("The candidate's email address, if present."),
    phone: z.string().nullable().describe("The candidate's phone number, if present."),
    location: z.string().nullable().describe("The candidate's city/state/country, if present."),

    summary: z
        .string()
        .nullable()
        .describe("The professional summary or objective statement, if present. Keep it concise (1-3 sentences)."),

    skills: z
        .array(z.string())
        .describe("All skills listed or implied (technical and soft). Extract tool/framework names concisely (e.g. 'React', 'Python', 'Leadership')."),

    workExperience: z
        .array(
            z.object({
                company: z.string().describe("Company or organization name."),
                title: z.string().describe("Job title held."),
                startDate: z.string().nullable().describe("Start date (e.g. 'Jan 2020', '2020', or null if not stated)."),
                endDate: z
                    .string()
                    .nullable()
                    .describe("End date (e.g. 'Dec 2023', 'Present', or null if not stated)."),
                highlights: z
                    .array(z.string())
                    .describe("2-4 key accomplishments or responsibilities from this role."),
            })
        )
        .describe("Work experience entries, ordered from most recent to oldest."),

    education: z
        .array(
            z.object({
                institution: z.string().describe("School or university name."),
                degree: z.string().describe("Degree type (e.g. 'B.S.', 'M.A.', 'Ph.D.')."),
                field: z.string().nullable().describe("Field of study (e.g. 'Computer Science'), or null if not stated."),
                graduationDate: z
                    .string()
                    .nullable()
                    .describe("Graduation date or expected date (e.g. '2021', 'May 2025'), or null if not stated."),
            })
        )
        .describe("Education entries, ordered from most recent to oldest."),

    certifications: z
        .array(z.string())
        .describe("Professional certifications, licenses, or relevant coursework (e.g. 'AWS Solutions Architect', 'PMP')."),

    yearsOfExperience: z
        .string()
        .nullable()
        .describe("Total years of professional experience, inferred from work history (e.g. '5 years', '10+ years'). Null if cannot be determined."),
});

export type ResumeExtraction = z.infer<typeof resumeExtractionSchema>;

/** Alias: canonical structure for user_resumes.parsedData (parsed_resume_data JSONB) */
export type ParsedResumeData = ResumeExtraction;

/**
 * System prompt guiding the LLM to act as an expert resume analyst
 * extracting structured data for interview coaching purposes.
 */
export const RESUME_ANALYSIS_SYSTEM_PROMPT = `
You are an expert Resume Analyst and Career Coach.
Your task is to analyze raw text extracted from a resume (either copy-pasted or from a PDF) and extract the key information into a highly structured JSON format.

INSTRUCTIONS:
1. Extract the candidate's contact information (name, email, phone, location) when available.
2. Capture the professional summary or objective if one exists.
3. List ALL skills — both technical (tools, frameworks, languages) and soft skills. Use concise names (e.g. "React" not "Experience with React.js framework").
4. Extract work experience entries in reverse chronological order. For each role, capture 2-4 key accomplishments or responsibilities.
5. Extract education entries in reverse chronological order.
6. List any certifications, licenses, or notable coursework.
7. Infer the total years of professional experience from the work history dates.

If a piece of information is missing from the resume, return null for that field rather than guessing.
Do not include irrelevant filler text. Stick to factual, extractable data.
If dates are ambiguous, use your best judgment based on context.
`;
