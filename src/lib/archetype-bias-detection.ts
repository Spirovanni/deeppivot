/**
 * Archetype Model Bias Detection
 *
 * Post-processing step for the archetyping engine. Analyzes the distribution
 * of archetypes across users to check for statistical bias. Flags significant
 * imbalances for human review.
 *
 * Uses only aggregate counts (no demographic data) to avoid privacy concerns.
 */

import "server-only";
import { db } from "@/src/db";
import { careerArchetypesTable } from "@/src/db/schema";
import { count } from "drizzle-orm";

export interface ArchetypeDistribution {
  archetypeName: string;
  count: number;
  share: number;
}

export interface BiasFlag {
  type: "over_representation" | "concentration";
  archetypeName?: string;
  message: string;
  distribution: ArchetypeDistribution[];
  total: number;
}

export interface BiasReport {
  total: number;
  distribution: ArchetypeDistribution[];
  flags: BiasFlag[];
  checkedAt: Date;
}

/** Threshold: flag if any archetype exceeds this share of total (0–1) */
const OVER_REPRESENTATION_THRESHOLD = 0.45;

/** Threshold: flag if top 2 archetypes combined exceed this share (0–1) */
const CONCENTRATION_THRESHOLD = 0.75;

/** Minimum sample size to run bias checks */
const MIN_SAMPLE_SIZE = 10;

/**
 * Analyze archetype distribution and flag significant imbalances.
 * Returns a report with distribution and any bias flags for human review.
 */
export async function checkArchetypeBias(): Promise<BiasReport> {
  const rows = await db
    .select({
      archetypeName: careerArchetypesTable.archetypeName,
      count: count(),
    })
    .from(careerArchetypesTable)
    .groupBy(careerArchetypesTable.archetypeName);

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  const distribution: ArchetypeDistribution[] = rows.map((r) => ({
    archetypeName: r.archetypeName,
    count: Number(r.count),
    share: total > 0 ? Number(r.count) / total : 0,
  }));

  const flags: BiasFlag[] = [];

  if (total < MIN_SAMPLE_SIZE) {
    return {
      total,
      distribution,
      flags,
      checkedAt: new Date(),
    };
  }

  // Sort by count descending
  const sorted = [...distribution].sort((a, b) => b.count - a.count);

  // Flag 1: Any single archetype over-represented
  for (const d of sorted) {
    if (d.share >= OVER_REPRESENTATION_THRESHOLD) {
      flags.push({
        type: "over_representation",
        archetypeName: d.archetypeName,
        message: `Archetype "${d.archetypeName}" assigned to ${(d.share * 100).toFixed(1)}% of users (threshold: ${OVER_REPRESENTATION_THRESHOLD * 100}%). May indicate model bias.`,
        distribution,
        total,
      });
    }
  }

  // Flag 2: Top 2 archetypes dominate
  const top2Share =
    sorted.length >= 2 ? sorted[0].share + sorted[1].share : sorted[0]?.share ?? 0;
  if (top2Share >= CONCENTRATION_THRESHOLD) {
    flags.push({
      type: "concentration",
      message: `Top 2 archetypes ("${sorted[0]?.archetypeName}" and "${sorted[1]?.archetypeName}") account for ${(top2Share * 100).toFixed(1)}% of assignments. Consider reviewing model calibration.`,
      distribution,
      total,
    });
  }

  return {
    total,
    distribution,
    flags,
    checkedAt: new Date(),
  };
}

/**
 * Run bias check and log flags for human review.
 * Call after archetyping completes. Non-blocking.
 */
export async function runBiasCheckAndLog(): Promise<void> {
  try {
    const report = await checkArchetypeBias();
    if (report.flags.length > 0) {
      console.warn(
        "[archetype-bias] Bias flags detected for human review:",
        JSON.stringify(
          report.flags.map((f) => ({ type: f.type, message: f.message })),
          null,
          2
        )
      );
    }
  } catch (err) {
    console.error("[archetype-bias] Bias check failed:", err);
  }
}
