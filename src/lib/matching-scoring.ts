/**
 * Pure scoring helpers for candidate-job matching (deeppivot-322).
 * Extracted for testability and threshold validation.
 */

const STOP_WORDS = new Set([
  "with", "that", "this", "from", "your", "will", "have", "years", "year",
  "experience", "role", "team", "work", "skills", "ability", "about", "their",
  "they", "them", "for", "and", "the", "you", "our", "are", "job", "position",
  "strong", "plus", "must", "nice", "required",
]);

export function toTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

export function getJobKeywords(title: string, description: string): Set<string> {
  const tokens = toTokens(`${title} ${description}`);
  return new Set(tokens.slice(0, 80));
}

export function getResumeSkills(parsedData: { skills?: string[] } | null): string[] {
  if (!parsedData || !Array.isArray(parsedData.skills)) return [];
  return parsedData.skills
    .map((skill) => String(skill).trim())
    .filter(Boolean)
    .slice(0, 25);
}

export function getResumeSkillTokens(skills: string[]): Set<string> {
  const tokens: string[] = [];
  for (const skill of skills) {
    tokens.push(...toTokens(skill));
  }
  return new Set(tokens);
}

export function parseYearsOfExperience(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const years = Number.parseFloat(match[1]);
  return Number.isFinite(years) ? years : null;
}

export function estimateSalaryExpectation(yearsOfExperience: number): number {
  const estimated = 45000 + yearsOfExperience * 12000;
  return Math.max(30000, Math.min(250000, estimated));
}

/**
 * Score 0-100: how well candidate's expected salary fits job range.
 * 100 = in range, 50 = no salary info or no experience.
 */
export function computeSalaryScore(
  salaryMin: number | null,
  salaryMax: number | null,
  yearsOfExperience: number | null
): number {
  if (salaryMin == null && salaryMax == null) return 50;
  if (yearsOfExperience == null) return 50;

  const expected = estimateSalaryExpectation(yearsOfExperience);
  const min = salaryMin ?? salaryMax ?? expected;
  const max = salaryMax ?? salaryMin ?? expected;
  const low = Math.min(min, max);
  const high = Math.max(min, max);

  if (expected >= low && expected <= high) return 100;

  const nearest = expected < low ? low : high;
  const distanceRatio = Math.min(Math.abs(expected - nearest) / Math.max(nearest, 1), 1);
  return Math.round(Math.max(0, 100 - distanceRatio * 100));
}

/**
 * Compute skill overlap score 0-100 from job keywords vs resume skill tokens.
 */
export function computeOverlapScore(
  jobKeywords: Set<string>,
  resumeSkillTokens: Set<string>
): number {
  if (jobKeywords.size === 0) return 0;
  const matched = [...jobKeywords].filter((t) => resumeSkillTokens.has(t));
  return Math.round((matched.length / jobKeywords.size) * 100);
}
