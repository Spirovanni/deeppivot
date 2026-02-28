import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

export interface CoverLetterContext {
    jobTitle: string;
    companyName: string | null;
    /** Skills the candidate has that match the JD requirements */
    matchedSkills: string[];
    /** Skills the JD requires that the candidate lacks */
    skillGaps: string[];
    /** Candidate's relevant work highlights mapped to JD responsibilities */
    relevantExperience: string[];
    /** JD responsibilities for framing the letter */
    keyResponsibilities: string[];
    /** Candidate name for the letter header */
    candidateName: string | null;
    /** Years of experience from resume or JD */
    yearsOfExperience: string | null;
    /** Company culture for tone matching */
    companyCulture: string | null;
}

/**
 * Merges job description extracted data with resume extracted data
 * to produce a unified context for cover letter generation.
 *
 * Identifies matched skills, skill gaps, and relevant experience
 * that the LLM can use to write a targeted cover letter.
 */
export function mergeCoverLetterContext(
    jdData: JobDescriptionExtraction,
    resumeData: ResumeExtraction | null
): CoverLetterContext {
    const jdSkills = new Set([
        ...(jdData.technicalSkillsRequired ?? []),
        ...(jdData.softSkillsRequired ?? []),
    ].map((s) => s.toLowerCase()));

    const resumeSkills = new Set(
        (resumeData?.skills ?? []).map((s) => s.toLowerCase())
    );

    // Find matched skills (case-insensitive, preserve original casing from JD)
    const allJdSkills = [
        ...(jdData.technicalSkillsRequired ?? []),
        ...(jdData.softSkillsRequired ?? []),
    ];
    const matchedSkills = allJdSkills.filter((s) =>
        resumeSkills.has(s.toLowerCase())
    );

    // Find skill gaps (JD requires but resume doesn't have)
    const skillGaps = allJdSkills.filter(
        (s) => !resumeSkills.has(s.toLowerCase())
    );

    // Extract relevant work highlights — find highlights that mention JD skills or responsibilities
    const relevantExperience: string[] = [];
    if (resumeData?.workExperience) {
        for (const job of resumeData.workExperience) {
            for (const highlight of job.highlights) {
                const lower = highlight.toLowerCase();
                const isRelevant = [...jdSkills].some((skill) =>
                    lower.includes(skill)
                );
                if (isRelevant) {
                    relevantExperience.push(
                        `${job.title} at ${job.company}: ${highlight}`
                    );
                }
            }
        }
        // If no keyword matches, include the top highlights from the most recent role
        if (relevantExperience.length === 0 && resumeData.workExperience.length > 0) {
            const recent = resumeData.workExperience[0];
            for (const highlight of recent.highlights.slice(0, 3)) {
                relevantExperience.push(
                    `${recent.title} at ${recent.company}: ${highlight}`
                );
            }
        }
    }

    return {
        jobTitle: jdData.jobTitle ?? "the role",
        companyName: jdData.companyName,
        matchedSkills,
        skillGaps,
        relevantExperience,
        keyResponsibilities: jdData.primaryResponsibilities ?? [],
        candidateName: resumeData?.fullName ?? null,
        yearsOfExperience:
            resumeData?.yearsOfExperience ?? jdData.yearsOfExperience,
        companyCulture: jdData.companyCulture,
    };
}
