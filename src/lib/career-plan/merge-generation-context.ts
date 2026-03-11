import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

export interface EducationProgram {
  name: string;
  provider: string;
  programType: string;
  duration: string;
  cost: number;
  roiScore: number | null;
  tags: string[];
  url: string;
}

export interface InterviewInsights {
  skills: Array<{ skill: string; score: number; note?: string }>;
  feedbackSummaries: string[];
}

export interface CareerPlanGenerationContext {
  // From resume
  candidateName: string | null;
  currentSkills: string[];
  yearsOfExperience: string | null;
  recentRoles: Array<{ title: string; company: string; highlights: string[] }>;
  education: Array<{ institution: string; degree: string; field: string | null }>;
  certifications: string[];

  // From target job
  targetJobTitle: string;
  targetCompany: string | null;
  requiredTechnicalSkills: string[];
  requiredSoftSkills: string[];
  primaryResponsibilities: string[];
  requiredExperience: string | null;

  // Gap analysis (computed)
  matchedSkills: string[];
  missingSkills: string[];

  // From archetype (optional)
  archetypeName: string | null;
  strengths: string[];
  growthAreas: string[];

  // From interview feedback (optional)
  interviewSkillScores: Array<{ skill: string; score: number; note?: string }>;
  interviewFeedbackSummaries: string[];

  // Education programs (optional)
  availablePrograms: EducationProgram[];
}

/**
 * Merges resume, job description, archetype, interview, and education data
 * into a unified context for career plan generation.
 *
 * Follows the same pattern as src/lib/cover-letter/merge-context.ts.
 */
export function mergeCareerPlanContext(
  resumeData: ResumeExtraction | null,
  jdData: JobDescriptionExtraction,
  archetype: { archetypeName: string; strengths: string[]; growthAreas: string[] } | null,
  interviewData: InterviewInsights | null,
  programs: EducationProgram[]
): CareerPlanGenerationContext {
  // Build skill sets for gap analysis (case-insensitive)
  const allJdSkills = [
    ...(jdData.technicalSkillsRequired ?? []),
    ...(jdData.softSkillsRequired ?? []),
  ];
  const resumeSkillsLower = new Set(
    (resumeData?.skills ?? []).map((s) => s.toLowerCase())
  );

  const matchedSkills = allJdSkills.filter((s) =>
    resumeSkillsLower.has(s.toLowerCase())
  );
  const missingSkills = allJdSkills.filter(
    (s) => !resumeSkillsLower.has(s.toLowerCase())
  );

  return {
    // Resume
    candidateName: resumeData?.fullName ?? null,
    currentSkills: resumeData?.skills ?? [],
    yearsOfExperience: resumeData?.yearsOfExperience ?? null,
    recentRoles: (resumeData?.workExperience ?? []).slice(0, 3).map((w) => ({
      title: w.title,
      company: w.company,
      highlights: w.highlights,
    })),
    education: (resumeData?.education ?? []).map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
    })),
    certifications: resumeData?.certifications ?? [],

    // Target job
    targetJobTitle: jdData.jobTitle ?? "the role",
    targetCompany: jdData.companyName,
    requiredTechnicalSkills: jdData.technicalSkillsRequired ?? [],
    requiredSoftSkills: jdData.softSkillsRequired ?? [],
    primaryResponsibilities: jdData.primaryResponsibilities ?? [],
    requiredExperience: jdData.yearsOfExperience,

    // Gap analysis
    matchedSkills,
    missingSkills,

    // Archetype
    archetypeName: archetype?.archetypeName ?? null,
    strengths: archetype?.strengths ?? [],
    growthAreas: archetype?.growthAreas ?? [],

    // Interview
    interviewSkillScores: interviewData?.skills ?? [],
    interviewFeedbackSummaries: interviewData?.feedbackSummaries ?? [],

    // Education
    availablePrograms: programs,
  };
}
