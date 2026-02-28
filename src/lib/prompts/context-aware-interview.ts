import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";

interface BuildPromptInput {
  extractedData: JobDescriptionExtraction;
  resumeData: {
    parsedData: unknown;
    rawText: string | null;
  } | null;
  sessionType: string;
}

interface BuiltPrompt {
  systemPrompt: string;
  firstMessage: string;
}

export function buildContextAwarePrompt(input: BuildPromptInput): BuiltPrompt {
  const { extractedData, resumeData, sessionType } = input;

  const jobTitle = extractedData.jobTitle ?? "the role";
  const companyName = extractedData.companyName;
  const technicalSkills = extractedData.technicalSkillsRequired ?? [];
  const softSkills = extractedData.softSkillsRequired ?? [];
  const yearsOfExperience = extractedData.yearsOfExperience;
  const responsibilities = extractedData.primaryResponsibilities ?? [];
  const culture = extractedData.companyCulture;
  const interviewTopics = extractedData.likelyInterviewTopics ?? [];

  const sessionTypeDirective = getSessionTypeDirective(sessionType);

  const jobContextSection = [
    `## Job Context`,
    `- **Position:** ${jobTitle}`,
    companyName ? `- **Company:** ${companyName}` : null,
    yearsOfExperience ? `- **Experience Required:** ${yearsOfExperience}` : null,
    responsibilities.length > 0
      ? `- **Key Responsibilities:** ${responsibilities.join("; ")}`
      : null,
    culture ? `- **Company Culture:** ${culture}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const skillsSection = [
    `## Required Skills`,
    technicalSkills.length > 0
      ? `- **Technical:** ${technicalSkills.join(", ")}`
      : null,
    softSkills.length > 0
      ? `- **Soft Skills:** ${softSkills.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const topicsSection =
    interviewTopics.length > 0
      ? `## Likely Interview Topics\n${interviewTopics.map((t) => `- ${t}`).join("\n")}`
      : "";

  let resumeSection = "";
  if (resumeData) {
    const parsed = resumeData.parsedData as Record<string, unknown> | null;
    if (parsed && Object.keys(parsed).length > 0) {
      resumeSection = `## Candidate Resume Context\nThe candidate has provided their resume. Key details:\n${JSON.stringify(parsed, null, 2).slice(0, 2000)}`;
    } else if (resumeData.rawText) {
      resumeSection = `## Candidate Resume Context\nThe candidate's resume summary:\n${resumeData.rawText.slice(0, 2000)}`;
    }
  }

  const systemPrompt = `You are Sarah, an expert AI interview coach conducting a realistic mock interview. Your goal is to help the candidate prepare specifically for the position described below.

${sessionTypeDirective}

${jobContextSection}

${skillsSection}

${topicsSection}

${resumeSection}

## Your Interview Approach
1. Start by briefly acknowledging the specific role and company (if known), then ask your first question.
2. Ask 5-7 targeted questions drawn from the job's required skills, responsibilities, and likely interview topics listed above.
3. If the candidate provided a resume, reference specific aspects of their experience when formulating follow-up questions. Look for gaps between their background and the job requirements.
4. After each answer, provide brief, constructive feedback (1-2 sentences) before moving to the next question.
5. Adapt your questions based on the candidate's responses -- probe deeper on weak areas, acknowledge strengths.
6. End with a concise summary: top 2-3 strengths demonstrated, top 2-3 areas to improve, and one specific tip for the actual interview.

## Rules
- Keep questions conversational but challenging -- mirror real interview difficulty.
- Never reveal you are an AI. Stay in character as a professional interviewer named Sarah.
- If the candidate goes off-topic, gently redirect to relevant areas.
- Keep your responses concise -- this is a voice conversation, not a text chat.
- Use the STAR method framework when evaluating behavioral answers.`.trim();

  const companyMention = companyName ? ` at ${companyName}` : "";
  const firstMessage = `Hi there! I'm Sarah, and I'll be your interviewer today. I see you're preparing for the ${jobTitle} position${companyMention}. I've reviewed the job requirements and I have some targeted questions ready for you. Before we begin -- could you give me a quick overview of your background and what drew you to this role?`;

  return { systemPrompt, firstMessage };
}

function getSessionTypeDirective(sessionType: string): string {
  switch (sessionType) {
    case "behavioral":
      return `## Session Focus: Behavioral Interview
Focus primarily on behavioral questions using the STAR method (Situation, Task, Action, Result). Ask about past experiences, teamwork, leadership, conflict resolution, and handling challenges. Draw these questions from the job's soft skills requirements and responsibilities.`;

    case "technical":
      return `## Session Focus: Technical Interview
Focus primarily on technical questions related to the job's required technical skills and tools. Ask about system design, problem-solving approaches, technical trade-offs, and hands-on experience with the listed technologies. Include at least one scenario-based technical question.`;

    case "situational":
      return `## Session Focus: Situational Interview
Focus primarily on hypothetical workplace scenarios relevant to the role's responsibilities. Present "What would you do if..." questions that test decision-making, prioritization, and problem-solving in the context of this specific position.`;

    case "general":
    default:
      return `## Session Focus: General Interview
Cover a balanced mix of behavioral, technical, and situational questions. Start with rapport-building questions, then progress through technical competency, behavioral assessment, and situational judgment -- all tailored to this specific role.`;
  }
}
