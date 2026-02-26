/**
 * Alt-Ed ROI Analysis utilities
 *
 * Calculates a simple, user-personalized ROI estimate for education programs
 * based on program cost, duration, and industry salary benchmarks.
 *
 * Formula:
 *   Net gain = (post-program salary - current salary) × projection period
 *             - program cost
 *             - opportunity cost (forgone income during study)
 *
 *   ROI % = (net gain / total invested) × 100
 *
 * All monetary values are in US dollars.
 */

// ─── Industry salary benchmarks (median annual USD) ──────────────────────────
// Source: BLS + LinkedIn Salary Insights (2025 medians)

export const SALARY_BENCHMARKS: Record<string, { entry: number; mid: number; senior: number }> = {
  "software-engineering": { entry: 85_000, mid: 120_000, senior: 165_000 },
  "data-science":          { entry: 80_000, mid: 115_000, senior: 155_000 },
  "data-engineering":      { entry: 90_000, mid: 130_000, senior: 170_000 },
  "machine-learning":      { entry: 95_000, mid: 135_000, senior: 180_000 },
  "ux-design":             { entry: 68_000, mid: 95_000,  senior: 130_000 },
  "product-management":    { entry: 85_000, mid: 120_000, senior: 160_000 },
  "cybersecurity":         { entry: 75_000, mid: 105_000, senior: 145_000 },
  "cloud-devops":          { entry: 85_000, mid: 118_000, senior: 155_000 },
  "project-management":    { entry: 65_000, mid: 90_000,  senior: 125_000 },
  "finance":               { entry: 65_000, mid: 95_000,  senior: 140_000 },
  "marketing":             { entry: 55_000, mid: 80_000,  senior: 115_000 },
  "healthcare-it":         { entry: 70_000, mid: 95_000,  senior: 125_000 },
  "skilled-trades":        { entry: 48_000, mid: 68_000,  senior: 90_000  },
  "general":               { entry: 55_000, mid: 75_000,  senior: 105_000 },
};

// ─── Program-type to time-to-study mapping (months) ──────────────────────────

const PROGRAM_TYPE_MONTHS: Record<string, number> = {
  bootcamp: 4,
  certification: 3,
  "online-course": 2,
  degree: 24,
  trade: 18,
  workshop: 0.5,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoiInputs {
  /** Current annual salary in USD */
  currentSalary: number;
  /** Career field key from SALARY_BENCHMARKS */
  targetField: string;
  /** Experience level after completing the program */
  targetLevel: "entry" | "mid" | "senior";
  /** Program cost in USD (not cents) */
  programCostUsd: number;
  /** Program duration string (e.g. "12 weeks", "6 months", "3-4 years") */
  programDuration: string;
  /** Program type (bootcamp | certification | degree | etc.) */
  programType: string;
  /** Projection horizon in years (default: 3) */
  projectionYears?: number;
  /** Whether the user studies full-time (forgoes income) — default false */
  fullTimeStudy?: boolean;
}

export interface RoiResult {
  currentSalary: number;
  postProgramSalary: number;
  annualGain: number;
  programCostUsd: number;
  opportunityCostUsd: number;
  totalInvestedUsd: number;
  netGainUsd: number;
  roiPercent: number;
  paybackMonths: number;
  projectionYears: number;
  breakEvenYear: number | null;
  summary: string;
}

// ─── Duration parser ──────────────────────────────────────────────────────────

function parseDurationMonths(duration: string, programType: string): number {
  const lower = duration.toLowerCase();

  // "X weeks" → months
  const weeksMatch = lower.match(/(\d+(?:\.\d+)?)\s*weeks?/);
  if (weeksMatch) return parseFloat(weeksMatch[1]) / 4.33;

  // "X months" → months
  const monthsMatch = lower.match(/(\d+(?:\.\d+)?)\s*months?/);
  if (monthsMatch) return parseFloat(monthsMatch[1]);

  // "X-Y months" → average
  const rangeMonthsMatch = lower.match(/(\d+)\s*[-–]\s*(\d+)\s*months?/);
  if (rangeMonthsMatch) {
    return (parseInt(rangeMonthsMatch[1]) + parseInt(rangeMonthsMatch[2])) / 2;
  }

  // "X years" → months
  const yearsMatch = lower.match(/(\d+(?:\.\d+)?)\s*years?/);
  if (yearsMatch) return parseFloat(yearsMatch[1]) * 12;

  // "X-Y years" → average months
  const rangeYearsMatch = lower.match(/(\d+)\s*[-–]\s*(\d+)\s*years?/);
  if (rangeYearsMatch) {
    return ((parseInt(rangeYearsMatch[1]) + parseInt(rangeYearsMatch[2])) / 2) * 12;
  }

  // "X hours" → 0 months (workshop)
  if (lower.includes("hours") || lower.includes("hour")) return 0.25;

  // Fallback: use program-type average
  return PROGRAM_TYPE_MONTHS[programType] ?? 3;
}

// ─── Main ROI calculator ──────────────────────────────────────────────────────

export function calculateRoi(inputs: RoiInputs): RoiResult {
  const {
    currentSalary,
    targetField,
    targetLevel,
    programCostUsd,
    programDuration,
    programType,
    projectionYears = 3,
    fullTimeStudy = false,
  } = inputs;

  const benchmark = SALARY_BENCHMARKS[targetField] ?? SALARY_BENCHMARKS["general"];
  const postProgramSalary = benchmark[targetLevel];
  const annualGain = Math.max(0, postProgramSalary - currentSalary);

  const durationMonths = parseDurationMonths(programDuration, programType);
  const opportunityCostUsd = fullTimeStudy
    ? (currentSalary / 12) * durationMonths
    : 0;

  const totalInvestedUsd = programCostUsd + opportunityCostUsd;
  const projectedGain = annualGain * projectionYears;
  const netGainUsd = projectedGain - totalInvestedUsd;
  const roiPercent = totalInvestedUsd > 0
    ? Math.round((netGainUsd / totalInvestedUsd) * 100)
    : annualGain > 0 ? 999 : 0;

  // Payback period: months until cumulative gain covers investment
  const paybackMonths = annualGain > 0
    ? Math.ceil((totalInvestedUsd / annualGain) * 12)
    : Infinity;

  const breakEvenYear =
    paybackMonths !== Infinity && isFinite(paybackMonths)
      ? Math.ceil(paybackMonths / 12)
      : null;

  // Human-readable summary
  let summary: string;
  if (roiPercent >= 200) {
    summary = `Excellent ROI — you'd recover your investment within ${paybackMonths < 12 ? `${paybackMonths} months` : `${breakEvenYear} year${breakEvenYear === 1 ? "" : "s"}`} and gain $${(annualGain / 1000).toFixed(0)}k/yr.`;
  } else if (roiPercent >= 50) {
    summary = `Solid ROI — expected break-even in ${breakEvenYear ?? "N/A"} year${breakEvenYear === 1 ? "" : "s"} with a $${(annualGain / 1000).toFixed(0)}k/yr salary increase.`;
  } else if (roiPercent >= 0) {
    summary = `Modest ROI over ${projectionYears} years. The program pays off, but primarily provides career value rather than immediate financial return.`;
  } else {
    summary = `Negative ROI over ${projectionYears} years at current salary benchmarks. Consider lower-cost alternatives or a longer projection horizon.`;
  }

  return {
    currentSalary,
    postProgramSalary,
    annualGain,
    programCostUsd,
    opportunityCostUsd,
    totalInvestedUsd,
    netGainUsd,
    roiPercent,
    paybackMonths: isFinite(paybackMonths) ? paybackMonths : -1,
    projectionYears,
    breakEvenYear,
    summary,
  };
}

// ─── Funding eligibility ──────────────────────────────────────────────────────

export interface FundingMatch {
  fundingId: number;
  name: string;
  fundingType: string;
  amount: number | null;
  eligibilityText: string;
  applicationUrl: string;
  deadline: Date | null;
  matchReason: string;
}

export interface FundingEligibilityInput {
  /** User's annual income in USD (0 = unknown) */
  annualIncomeUsd: number;
  /** US state abbreviation (e.g. "NY") — null = unknown */
  state: string | null;
  /** Whether the user is a US citizen */
  usCitizen: boolean;
  /** Whether the user is a veteran */
  isVeteran: boolean;
  /** Whether the user was recently laid off / dislocated worker */
  isDislocatedWorker: boolean;
  /** Whether user is a first-generation college student */
  isFirstGenStudent: boolean;
  /** Program type being evaluated */
  programType: string;
  /** Program tags from the education_programs table */
  programTags: string[];
}

/**
 * Cross-reference a set of funding opportunities against user profile data
 * and return matched opportunities with a reason.
 *
 * Note: This is a heuristic/rules-based match — not a legal determination.
 */
export function matchFundingEligibility(
  opportunities: Array<{
    id: number;
    name: string;
    fundingType: string;
    amount: number | null;
    eligibilityText: string;
    applicationUrl: string;
    deadline: Date | null;
  }>,
  profile: FundingEligibilityInput
): FundingMatch[] {
  const matches: FundingMatch[] = [];

  for (const opp of opportunities) {
    const eligText = opp.eligibilityText.toLowerCase();
    const reasons: string[] = [];

    // WIOA / American Job Center
    if (eligText.includes("wioa") || eligText.includes("american job center")) {
      if (profile.isDislocatedWorker) {
        reasons.push("You qualify as a dislocated worker under WIOA");
      }
      if (profile.annualIncomeUsd > 0 && profile.annualIncomeUsd < 40_000) {
        reasons.push("Your income level may meet WIOA adult eligibility");
      }
    }

    // Pell Grant
    if (eligText.includes("pell") || eligText.includes("fafsa") || eligText.includes("financial need")) {
      if (profile.usCitizen && profile.annualIncomeUsd < 50_000) {
        reasons.push("You may qualify based on financial need (FAFSA-based)");
      }
      if (profile.programType === "degree") {
        reasons.push("Pell Grant is available for accredited degree programs");
      }
    }

    // Veterans
    if (eligText.includes("veteran") || eligText.includes("gi bill")) {
      if (profile.isVeteran) {
        reasons.push("You're eligible as a U.S. veteran");
      }
    }

    // WOTC / ex-felon / long-term unemployed
    if (eligText.includes("targeted groups") || eligText.includes("long-term unemployed")) {
      if (profile.isDislocatedWorker) {
        reasons.push("Targeted at dislocated/long-term unemployed workers");
      }
    }

    // First-generation
    if (eligText.includes("first-generation") || eligText.includes("first generation")) {
      if (profile.isFirstGenStudent) {
        reasons.push("Available to first-generation college students");
      }
    }

    // State-specific (rough heuristic)
    if (profile.state && eligText.includes(profile.state.toLowerCase())) {
      reasons.push(`This opportunity is available in ${profile.state}`);
    }

    // ISA (Income Share Agreement) — always potentially eligible
    if (opp.fundingType === "isa") {
      reasons.push("ISA available — no upfront payment required");
    }

    // Free programs with financial aid
    if (opp.amount === 0 && eligText.includes("financial aid")) {
      reasons.push("Financial aid available — apply for full access at no cost");
    }

    if (reasons.length > 0) {
      matches.push({
        fundingId: opp.id,
        name: opp.name,
        fundingType: opp.fundingType,
        amount: opp.amount,
        eligibilityText: opp.eligibilityText,
        applicationUrl: opp.applicationUrl,
        deadline: opp.deadline,
        matchReason: reasons.join("; "),
      });
    }
  }

  // Sort: ISA first, then grants, then scholarships, then loans
  const order = ["isa", "grant", "scholarship", "loan"];
  matches.sort((a, b) => {
    const ai = order.indexOf(a.fundingType);
    const bi = order.indexOf(b.fundingType);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return matches;
}
