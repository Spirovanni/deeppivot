import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

/**
 * Build a dense, semantically rich text representation of a resume profile
 * for embedding and downstream matching/search.
 */
export function buildResumeEmbeddingText(input: {
  title?: string | null;
  rawText?: string | null;
  parsedData?: ResumeExtraction | null;
}): string {
  const parsed = input.parsedData;

  if (!parsed) {
    return `${input.title ? `Resume Title: ${input.title}\n` : ""}${input.rawText ?? ""}`.trim();
  }

  const parts: string[] = [
    input.title ? `Resume Title: ${input.title}` : "",
    parsed.fullName ? `Name: ${parsed.fullName}` : "",
    parsed.location ? `Location: ${parsed.location}` : "",
    parsed.summary ? `Summary: ${parsed.summary}` : "",
    parsed.skills?.length ? `Skills: ${parsed.skills.join(", ")}` : "",
    parsed.yearsOfExperience ? `Experience: ${parsed.yearsOfExperience}` : "",
    parsed.workExperience?.length
      ? `Roles: ${parsed.workExperience
          .map((role) => `${role.title} at ${role.company}`)
          .join("; ")}`
      : "",
    parsed.certifications?.length
      ? `Certifications: ${parsed.certifications.join(", ")}`
      : "",
    input.rawText ? `Raw Resume: ${input.rawText.slice(0, 4000)}` : "",
  ];

  return parts.filter(Boolean).join("\n");
}

