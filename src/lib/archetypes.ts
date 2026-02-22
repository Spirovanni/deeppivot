// ─── Dimension keys ──────────────────────────────────────────────────────────

export type DimensionKey =
  | "analytical"
  | "creative"
  | "social"
  | "leadership"
  | "technical"
  | "empathetic";

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  analytical: "Analytical",
  creative: "Creative",
  social: "Social",
  leadership: "Leadership",
  technical: "Technical",
  empathetic: "Empathetic",
};

// ─── Assessment questions (18 total, 3 per dimension) ────────────────────────

export interface Question {
  id: string;
  text: string;
  dimension: DimensionKey;
}

export const QUESTIONS: Question[] = [
  // Analytical
  { id: "a1", dimension: "analytical", text: "I prefer to analyze data before making decisions." },
  { id: "a2", dimension: "analytical", text: "I break complex problems into smaller, logical steps." },
  { id: "a3", dimension: "analytical", text: "I enjoy finding patterns and meaning in information." },
  // Creative
  { id: "c1", dimension: "creative", text: "I frequently come up with unconventional approaches to problems." },
  { id: "c2", dimension: "creative", text: "I enjoy brainstorming sessions and blue-sky thinking." },
  { id: "c3", dimension: "creative", text: "I see setbacks as opportunities to design something better." },
  // Social
  { id: "s1", dimension: "social", text: "I feel energised when working closely with other people." },
  { id: "s2", dimension: "social", text: "Building strong relationships is central to how I work." },
  { id: "s3", dimension: "social", text: "I naturally connect people who could benefit from knowing each other." },
  // Leadership
  { id: "l1", dimension: "leadership", text: "I take initiative and step up in uncertain situations." },
  { id: "l2", dimension: "leadership", text: "I enjoy setting direction and aligning a team toward a goal." },
  { id: "l3", dimension: "leadership", text: "I am comfortable making decisions that others will depend on." },
  // Technical
  { id: "t1", dimension: "technical", text: "I enjoy learning and applying new tools, systems, or technologies." },
  { id: "t2", dimension: "technical", text: "I take pride in building things that are reliable and well-crafted." },
  { id: "t3", dimension: "technical", text: "I go deep into technical details to fully understand a problem." },
  // Empathetic
  { id: "e1", dimension: "empathetic", text: "I easily pick up on what others are feeling, even when unspoken." },
  { id: "e2", dimension: "empathetic", text: "I prioritise the human impact when evaluating decisions." },
  { id: "e3", dimension: "empathetic", text: "I naturally adjust my communication style to suit each person." },
];

// Questions split into 3 steps of 6 for the multi-step form
export const STEPS = [
  QUESTIONS.slice(0, 6),
  QUESTIONS.slice(6, 12),
  QUESTIONS.slice(12, 18),
];

// ─── Archetype definitions ────────────────────────────────────────────────────

export interface ArchetypeDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  /** Ideal score 1–5 per dimension */
  profile: Record<DimensionKey, number>;
  strengths: string[];
  growthAreas: string[];
  idealRoles: string[];
}

export const ARCHETYPES: ArchetypeDefinition[] = [
  {
    id: "strategist",
    name: "The Strategist",
    emoji: "♟️",
    tagline: "Big-picture thinker who turns vision into plans.",
    description:
      "Strategists thrive on long-range planning and systems thinking. You excel at identifying opportunities, building frameworks, and leading others toward ambitious goals with analytical precision.",
    profile: { analytical: 5, creative: 3, social: 3, leadership: 5, technical: 3, empathetic: 2 },
    strengths: [
      "Long-term and systems thinking",
      "Translating vision into actionable roadmaps",
      "Analytical decision-making under uncertainty",
      "Influencing stakeholders with data-backed narratives",
    ],
    growthAreas: [
      "Embracing ambiguity without over-planning",
      "Building deeper empathy for front-line perspectives",
      "Delegating execution details more freely",
    ],
    idealRoles: ["Product Manager", "Management Consultant", "Strategy Director", "COO"],
  },
  {
    id: "innovator",
    name: "The Innovator",
    emoji: "💡",
    tagline: "Creative problem-solver who challenges the status quo.",
    description:
      "Innovators are driven by the thrill of creating something new. You combine creativity with technical curiosity to experiment rapidly, challenge conventions, and turn abstract ideas into tangible products.",
    profile: { analytical: 3, creative: 5, social: 3, leadership: 3, technical: 4, empathetic: 2 },
    strengths: [
      "Rapid prototyping and experimentation",
      "Cross-disciplinary thinking and ideation",
      "Comfortable with failure as a learning tool",
      "Translating ideas into working prototypes",
    ],
    growthAreas: [
      "Finishing and shipping, not just starting",
      "Communicating ideas clearly to non-technical stakeholders",
      "Managing risk and scope in innovation projects",
    ],
    idealRoles: ["Startup Founder", "Product Designer", "R&D Engineer", "Innovation Lead"],
  },
  {
    id: "connector",
    name: "The Connector",
    emoji: "🤝",
    tagline: "Relationship builder who makes the whole greater than its parts.",
    description:
      "Connectors are the social glue of every team. You instinctively build networks, foster collaboration, and create environments where people feel valued and motivated to do their best work.",
    profile: { analytical: 2, creative: 3, social: 5, leadership: 3, technical: 2, empathetic: 5 },
    strengths: [
      "Building trust and psychological safety",
      "Cross-functional collaboration and alignment",
      "Identifying and leveraging people's strengths",
      "Mediating conflict and finding common ground",
    ],
    growthAreas: [
      "Setting firmer boundaries in high-demand environments",
      "Developing more comfort with hard data and analysis",
      "Making decisions without full consensus",
    ],
    idealRoles: ["Community Manager", "HR Business Partner", "Account Executive", "Partnership Lead"],
  },
  {
    id: "analyst",
    name: "The Analyst",
    emoji: "📊",
    tagline: "Data-driven expert who finds signal in the noise.",
    description:
      "Analysts are masters of precision and depth. You thrive when diving deep into complex datasets, uncovering hidden insights, and building rigorous frameworks that inform critical decisions.",
    profile: { analytical: 5, creative: 2, social: 2, leadership: 2, technical: 5, empathetic: 2 },
    strengths: [
      "Structured problem decomposition",
      "Rigorous data analysis and interpretation",
      "Building reliable models and forecasts",
      "Identifying root causes others overlook",
    ],
    growthAreas: [
      "Communicating insights to non-technical audiences",
      "Tolerating ambiguity when perfect data isn't available",
      "Building executive presence and stakeholder influence",
    ],
    idealRoles: ["Data Scientist", "Business Analyst", "Financial Analyst", "Research Engineer"],
  },
  {
    id: "builder",
    name: "The Builder",
    emoji: "🔨",
    tagline: "Craftsperson who ships reliable, high-quality work.",
    description:
      "Builders take pride in execution. You combine technical mastery with a creative eye for elegant solutions, always focused on delivering work that is robust, scalable, and genuinely useful.",
    profile: { analytical: 3, creative: 4, social: 2, leadership: 3, technical: 5, empathetic: 2 },
    strengths: [
      "Deep technical execution and craftsmanship",
      "Designing scalable, maintainable systems",
      "Debugging and root-cause analysis",
      "Delivering high-quality output under pressure",
    ],
    growthAreas: [
      "Zooming out from implementation to product strategy",
      "Delegating tasks and trusting others' implementations",
      "Developing communication skills for leadership roles",
    ],
    idealRoles: ["Software Engineer", "DevOps Engineer", "Solutions Architect", "CTO"],
  },
  {
    id: "advocate",
    name: "The Advocate",
    emoji: "🌟",
    tagline: "Mission-driven leader who puts people first.",
    description:
      "Advocates combine strong empathy with purposeful leadership. You are motivated by creating meaningful impact for others, championing causes, and building inclusive environments where everyone can thrive.",
    profile: { analytical: 2, creative: 2, social: 4, leadership: 4, technical: 2, empathetic: 5 },
    strengths: [
      "Inspiring and motivating diverse teams",
      "Championing DEI and inclusive practices",
      "Active listening and conflict resolution",
      "Communicating purpose and building mission alignment",
    ],
    growthAreas: [
      "Developing comfort with operational metrics and KPIs",
      "Making tough calls without unanimous buy-in",
      "Balancing empathy with accountability",
    ],
    idealRoles: ["People Operations Lead", "Non-profit Director", "DEI Lead", "Social Impact Manager"],
  },
];

// ─── Scoring algorithm ────────────────────────────────────────────────────────

export type Answers = Record<string, number>; // questionId → 1-5

export interface TraitScore {
  dimension: DimensionKey;
  label: string;
  score: number;      // raw sum (3–15)
  normalized: number; // 1–5
}

export interface AssessmentResult {
  archetype: ArchetypeDefinition;
  traits: TraitScore[];
}

export function computeArchetype(answers: Answers): AssessmentResult {
  // 1. Sum scores per dimension
  const rawScores: Record<DimensionKey, number> = {
    analytical: 0,
    creative: 0,
    social: 0,
    leadership: 0,
    technical: 0,
    empathetic: 0,
  };

  for (const q of QUESTIONS) {
    rawScores[q.dimension] += answers[q.id] ?? 3; // default neutral if missing
  }

  // Normalise to 1-5 (3 questions × max 5 = 15 → divide by 3)
  const traits: TraitScore[] = (Object.entries(rawScores) as [DimensionKey, number][]).map(
    ([dimension, raw]) => ({
      dimension,
      label: DIMENSION_LABELS[dimension],
      score: raw,
      normalized: parseFloat((raw / 3).toFixed(2)),
    })
  );

  const userProfile = Object.fromEntries(
    traits.map(({ dimension, normalized }) => [dimension, normalized])
  ) as Record<DimensionKey, number>;

  // 2. Find closest archetype using Euclidean distance
  let best: ArchetypeDefinition = ARCHETYPES[0];
  let bestDist = Infinity;

  for (const archetype of ARCHETYPES) {
    let dist = 0;
    for (const dim of Object.keys(userProfile) as DimensionKey[]) {
      dist += Math.pow(userProfile[dim] - archetype.profile[dim], 2);
    }
    dist = Math.sqrt(dist);
    if (dist < bestDist) {
      bestDist = dist;
      best = archetype;
    }
  }

  return { archetype: best, traits };
}
