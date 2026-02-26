/**
 * Seed script: career_archetypes global presets
 *
 * Populates the `career_archetypes` table with system-level archetypes.
 * These are "template" rows (userId = special system user or null-equivalent)
 * that serve as reference labels for the AI archetyping engine.
 *
 * NOTE: career_archetypes rows are user-specific by schema design (userId NOT NULL).
 * For global/system archetypes, this script inserts them as admin-owned rows
 * using the first admin user in the database. Create an admin user first via
 * the app or directly in the DB.
 *
 * Run:
 *   npx tsx scripts/seed-archetypes.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, isNull } from "drizzle-orm";
import * as schema from "../src/db/schema";

const db = drizzle(process.env.DATABASE_URL!, { schema });

// ─── Archetype definitions ────────────────────────────────────────────────────

const ARCHETYPES: Array<{
  name: string;
  traits: { dimension: string; score: number; normalized: number }[];
  strengths: string[];
  growthAreas: string[];
}> = [
  {
    name: "The Analyst",
    traits: [
      { dimension: "data_orientation", score: 90, normalized: 0.9 },
      { dimension: "systematic_thinking", score: 85, normalized: 0.85 },
      { dimension: "communication", score: 60, normalized: 0.6 },
      { dimension: "leadership", score: 50, normalized: 0.5 },
    ],
    strengths: [
      "Deep problem decomposition",
      "Evidence-based decision making",
      "Pattern recognition",
      "Quantitative modeling",
    ],
    growthAreas: [
      "Executive communication",
      "Stakeholder influence without authority",
      "Tolerating ambiguity",
    ],
  },
  {
    name: "The Creator",
    traits: [
      { dimension: "creativity", score: 92, normalized: 0.92 },
      { dimension: "divergent_thinking", score: 88, normalized: 0.88 },
      { dimension: "execution", score: 65, normalized: 0.65 },
      { dimension: "process_discipline", score: 45, normalized: 0.45 },
    ],
    strengths: [
      "Generating novel concepts",
      "Cross-domain synthesis",
      "Storytelling and visual communication",
      "Rapid prototyping",
    ],
    growthAreas: [
      "Shipping and follow-through",
      "Prioritization under constraints",
      "Measurable outcome definition",
    ],
  },
  {
    name: "The Leader",
    traits: [
      { dimension: "leadership", score: 93, normalized: 0.93 },
      { dimension: "emotional_intelligence", score: 85, normalized: 0.85 },
      { dimension: "strategic_vision", score: 80, normalized: 0.8 },
      { dimension: "technical_depth", score: 50, normalized: 0.5 },
    ],
    strengths: [
      "Building and motivating teams",
      "Cross-functional alignment",
      "Vision setting and communication",
      "Change management",
    ],
    growthAreas: [
      "Technical credibility",
      "Individual contributor output",
      "Depth vs. breadth tradeoffs",
    ],
  },
  {
    name: "The Builder",
    traits: [
      { dimension: "execution", score: 95, normalized: 0.95 },
      { dimension: "technical_depth", score: 88, normalized: 0.88 },
      { dimension: "ownership", score: 90, normalized: 0.9 },
      { dimension: "strategic_thinking", score: 60, normalized: 0.6 },
    ],
    strengths: [
      "End-to-end ownership",
      "Rapid iteration and delivery",
      "Technical problem solving",
      "Pragmatic decision making",
    ],
    growthAreas: [
      "Strategic altitude",
      "Delegating and scaling through others",
      "Saying no to scope creep",
    ],
  },
  {
    name: "The Connector",
    traits: [
      { dimension: "relationship_building", score: 94, normalized: 0.94 },
      { dimension: "empathy", score: 90, normalized: 0.9 },
      { dimension: "collaboration", score: 88, normalized: 0.88 },
      { dimension: "deep_expertise", score: 55, normalized: 0.55 },
    ],
    strengths: [
      "Network development",
      "Bridging disparate groups",
      "Conflict resolution",
      "Customer and partner advocacy",
    ],
    growthAreas: [
      "Technical depth",
      "Data-driven argumentation",
      "Pushing back constructively",
    ],
  },
  {
    name: "The Strategist",
    traits: [
      { dimension: "strategic_vision", score: 92, normalized: 0.92 },
      { dimension: "systems_thinking", score: 88, normalized: 0.88 },
      { dimension: "market_awareness", score: 85, normalized: 0.85 },
      { dimension: "operational_execution", score: 55, normalized: 0.55 },
    ],
    strengths: [
      "Long-range planning",
      "Competitive analysis",
      "Scenario modeling",
      "Resource allocation decisions",
    ],
    growthAreas: [
      "Execution and operational detail",
      "Building trust through consistent delivery",
      "Managing day-to-day ambiguity",
    ],
  },
  {
    name: "The Advocate",
    traits: [
      { dimension: "mission_alignment", score: 95, normalized: 0.95 },
      { dimension: "communication", score: 88, normalized: 0.88 },
      { dimension: "empathy", score: 90, normalized: 0.9 },
      { dimension: "commercial_acumen", score: 50, normalized: 0.5 },
    ],
    strengths: [
      "Articulating purpose and impact",
      "Community and coalition building",
      "Persuasive writing and speaking",
      "Long-term mission focus",
    ],
    growthAreas: [
      "Financial sustainability thinking",
      "Prioritizing among competing causes",
      "Operating within resource constraints",
    ],
  },
  {
    name: "The Operator",
    traits: [
      { dimension: "process_discipline", score: 92, normalized: 0.92 },
      { dimension: "reliability", score: 95, normalized: 0.95 },
      { dimension: "detail_orientation", score: 90, normalized: 0.9 },
      { dimension: "innovation", score: 50, normalized: 0.5 },
    ],
    strengths: [
      "Flawless execution of complex workflows",
      "Scaling repeatable systems",
      "Risk and compliance management",
      "Operational efficiency",
    ],
    growthAreas: [
      "Embracing ambiguity and rapid change",
      "Strategic influence",
      "Iterating on imperfect information",
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Find any admin user to own these system archetypes
  const [adminUser] = await db
    .select({ id: schema.usersTable.id })
    .from(schema.usersTable)
    .where(eq(schema.usersTable.role, "admin"))
    .limit(1);

  if (!adminUser) {
    console.error(
      "❌  No admin user found. Create an admin user first:\n" +
      "    UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
    );
    process.exit(1);
  }

  console.log(`✓  Using admin user id=${adminUser.id} as system archetype owner`);

  let inserted = 0;
  let skipped = 0;

  for (const arch of ARCHETYPES) {
    // Check if this archetype name already exists for this user
    const [existing] = await db
      .select({ id: schema.careerArchetypesTable.id })
      .from(schema.careerArchetypesTable)
      .where(
        and(
          eq(schema.careerArchetypesTable.userId, adminUser.id),
          eq(schema.careerArchetypesTable.archetypeName, arch.name)
        )
      )
      .limit(1);

    if (existing) {
      console.log(`  skip  "${arch.name}" (already exists)`);
      skipped++;
      continue;
    }

    await db.insert(schema.careerArchetypesTable).values({
      userId: adminUser.id,
      archetypeName: arch.name,
      traits: arch.traits,
      strengths: arch.strengths,
      growthAreas: arch.growthAreas,
    });

    console.log(`  ✓     "${arch.name}"`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
