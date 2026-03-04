/**
 * Build a semantically rich text blob for marketplace job embeddings.
 */
export function buildMarketplaceJobEmbeddingText(input: {
  title: string;
  description: string;
  companyName?: string | null;
  location?: string | null;
  jobType?: string | null;
  experienceLevel?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  remoteFlag?: boolean | null;
}): string {
  const salaryText =
    input.salaryMin != null || input.salaryMax != null
      ? `Salary Range: ${input.salaryMin ?? "?"} to ${input.salaryMax ?? "?"}`
      : "";

  const parts = [
    `Job Title: ${input.title}`,
    input.companyName ? `Company: ${input.companyName}` : "",
    `Description: ${input.description}`,
    input.location ? `Location: ${input.location}` : "",
    input.remoteFlag ? "Remote: true" : "",
    input.jobType ? `Job Type: ${input.jobType}` : "",
    input.experienceLevel ? `Experience Level: ${input.experienceLevel}` : "",
    salaryText,
  ];

  return parts.filter(Boolean).join("\n");
}

