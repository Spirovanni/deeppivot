import { generateCompletion } from "../llm";
import {
  CAREER_PLAN_GENERATION_SYSTEM_PROMPT,
  careerPlanGenerationSchema,
  type GeneratedCareerPlan,
} from "./prompts/career-plan-generation";
import type { CareerPlanGenerationContext } from "@/src/lib/career-plan/merge-generation-context";

/**
 * Build a structured user prompt from the merged career plan context.
 */
function buildCareerPlanUserPrompt(ctx: CareerPlanGenerationContext): string {
  const sections: string[] = [];

  // Candidate profile
  sections.push("## Candidate Profile");
  if (ctx.candidateName) sections.push(`**Name:** ${ctx.candidateName}`);
  if (ctx.yearsOfExperience)
    sections.push(`**Years of Experience:** ${ctx.yearsOfExperience}`);
  if (ctx.currentSkills.length > 0)
    sections.push(`**Current Skills:** ${ctx.currentSkills.join(", ")}`);

  if (ctx.recentRoles.length > 0) {
    sections.push("\n**Recent Work Experience:**");
    for (const role of ctx.recentRoles) {
      sections.push(`- ${role.title} at ${role.company}`);
      for (const h of role.highlights.slice(0, 3)) {
        sections.push(`  - ${h}`);
      }
    }
  }

  if (ctx.education.length > 0) {
    sections.push(
      `\n**Education:** ${ctx.education.map((e) => `${e.degree}${e.field ? ` in ${e.field}` : ""} from ${e.institution}`).join("; ")}`
    );
  }

  if (ctx.certifications.length > 0) {
    sections.push(`**Certifications:** ${ctx.certifications.join(", ")}`);
  }

  // Target role
  sections.push("\n## Target Role");
  sections.push(`**Job Title:** ${ctx.targetJobTitle}`);
  if (ctx.targetCompany) sections.push(`**Company:** ${ctx.targetCompany}`);
  if (ctx.requiredTechnicalSkills.length > 0)
    sections.push(
      `**Required Technical Skills:** ${ctx.requiredTechnicalSkills.join(", ")}`
    );
  if (ctx.requiredSoftSkills.length > 0)
    sections.push(
      `**Required Soft Skills:** ${ctx.requiredSoftSkills.join(", ")}`
    );
  if (ctx.primaryResponsibilities.length > 0) {
    sections.push("**Key Responsibilities:**");
    for (const r of ctx.primaryResponsibilities) {
      sections.push(`- ${r}`);
    }
  }
  if (ctx.requiredExperience)
    sections.push(`**Required Experience:** ${ctx.requiredExperience}`);

  // Gap analysis
  sections.push("\n## Skill Gap Analysis");
  sections.push(
    `**Matched Skills (${ctx.matchedSkills.length}):** ${ctx.matchedSkills.join(", ") || "None"}`
  );
  sections.push(
    `**Missing Skills (${ctx.missingSkills.length}):** ${ctx.missingSkills.join(", ") || "None"}`
  );

  // Archetype
  if (ctx.archetypeName) {
    sections.push(`\n## Career Archetype: ${ctx.archetypeName}`);
    if (ctx.strengths.length > 0)
      sections.push(`**Strengths:** ${ctx.strengths.join(", ")}`);
    if (ctx.growthAreas.length > 0)
      sections.push(`**Growth Areas:** ${ctx.growthAreas.join(", ")}`);
  }

  // Interview performance
  if (ctx.interviewSkillScores.length > 0) {
    sections.push("\n## Interview Performance");
    for (const s of ctx.interviewSkillScores) {
      sections.push(
        `- ${s.skill}: ${s.score}/100${s.note ? ` (${s.note})` : ""}`
      );
    }
  }
  if (ctx.interviewFeedbackSummaries.length > 0) {
    sections.push("**Recent Feedback:**");
    for (const f of ctx.interviewFeedbackSummaries.slice(0, 3)) {
      sections.push(`- ${f.slice(0, 300)}`);
    }
  }

  // Education programs
  if (ctx.availablePrograms.length > 0) {
    sections.push("\n## Available Education Programs");
    for (const p of ctx.availablePrograms) {
      const costStr = p.cost > 0 ? `$${Math.round(p.cost / 100)}` : "Free";
      sections.push(
        `- **${p.name}** by ${p.provider} (${p.programType}, ${p.duration}, ${costStr}) — ${p.url}`
      );
    }
  }

  sections.push(
    "\n---\nGenerate a career development plan with 5-8 milestones based on the above context. Return valid JSON."
  );

  return sections.join("\n");
}

/**
 * Generate a career plan using the LLM.
 */
export async function generateCareerPlan(
  context: CareerPlanGenerationContext
): Promise<GeneratedCareerPlan> {
  const userPrompt = buildCareerPlanUserPrompt(context);

  const { content } = await generateCompletion({
    messages: [
      { role: "system", content: CAREER_PLAN_GENERATION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 3000,
    temperature: 0.6,
  });

  // Extract JSON from response (LLM may wrap in markdown code fences)
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = careerPlanGenerationSchema.parse(JSON.parse(jsonStr));
  return parsed;
}
