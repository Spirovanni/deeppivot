"use server";

/**
 * WDB Career Plan Integration
 *
 * Links a user's DeepPivot career plan milestones to their official WDB case plan.
 * When a user is identified as a WDB client (via Salesforce sync), career plan
 * builders can optionally align their goals with WDB-defined objectives.
 */

import { db } from "@/src/db";
import {
  usersTable,
  careerMilestonesTable,
} from "@/src/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WdbLinkInput {
  salesforceContactId: string;
  casePlanId: string;
  enrolledAt?: string; // ISO date string
}

export interface WdbStatus {
  isWdbClient: boolean;
  salesforceContactId: string | null;
  casePlanId: string | null;
  enrolledAt: Date | null;
}

/**
 * Standard WDB goal categories per WIOA Individual Employment Plan (IEP).
 * These are the common goal areas defined in WIOA Title I Adult/DW services.
 */
export const WDB_GOAL_CATEGORIES = [
  "Occupational Skills Training",
  "On-the-Job Training (OJT)",
  "Work Experience / Internship",
  "Job Search Assistance",
  "Basic Skills / Adult Education",
  "GED / HiSET Attainment",
  "Credential / Certification Completion",
  "Employment Placement",
  "Wage Progression",
  "Career Advancement",
  "Supportive Services",
  "Registered Apprenticeship",
] as const;

export type WdbGoalCategory = (typeof WDB_GOAL_CATEGORIES)[number];

export interface WdbAlignedMilestone {
  title: string;
  description: string;
  category: WdbGoalCategory;
  targetDate?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Not authenticated");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.clerkId, clerkUser.id), isNull(usersTable.deletedAt)))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user;
}

// ─── Get WDB status ───────────────────────────────────────────────────────────

export async function getWdbStatus(): Promise<WdbStatus> {
  const user = await getAuthenticatedUser();

  return {
    isWdbClient: !!user.wdbSalesforceContactId,
    salesforceContactId: user.wdbSalesforceContactId ?? null,
    casePlanId: user.wdbCasePlanId ?? null,
    enrolledAt: user.wdbEnrolledAt ?? null,
  };
}

// ─── Link WDB record ──────────────────────────────────────────────────────────

/**
 * Link a DeepPivot user to their Salesforce WDB record.
 * Called by admins or the Inngest Salesforce sync job.
 */
export async function linkWdbRecord(
  dbUserId: number,
  link: WdbLinkInput
): Promise<void> {
  await db
    .update(usersTable)
    .set({
      wdbSalesforceContactId: link.salesforceContactId,
      wdbCasePlanId: link.casePlanId,
      wdbEnrolledAt: link.enrolledAt ? new Date(link.enrolledAt) : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, dbUserId));
}

// ─── Create WDB-aligned milestones ────────────────────────────────────────────

/**
 * Create career milestones pre-populated with WDB IEP goals.
 * Milestones are tagged with the WDB category in the description.
 * The user can customise them freely after creation.
 */
export async function createWdbAlignedMilestones(
  milestones: WdbAlignedMilestone[]
): Promise<void> {
  const user = await getAuthenticatedUser();

  if (!user.wdbSalesforceContactId) {
    throw new Error("You must be linked to a WDB record to use this feature.");
  }

  // Get current milestone count for ordering
  const existing = await db
    .select({ orderIndex: careerMilestonesTable.orderIndex })
    .from(careerMilestonesTable)
    .where(and(
      eq(careerMilestonesTable.userId, user.id),
      isNull(careerMilestonesTable.deletedAt)
    ))
    .orderBy(careerMilestonesTable.orderIndex);

  const startIndex = existing.length > 0
    ? (existing[existing.length - 1]?.orderIndex ?? 0) + 1
    : 0;

  const values = milestones.map((m, i) => ({
    userId: user.id,
    title: m.title,
    description: `[WDB: ${m.category}]\n\n${m.description}`.trim(),
    targetDate: m.targetDate ? new Date(m.targetDate) : null,
    status: "planned" as const,
    orderIndex: startIndex + i,
  }));

  if (values.length > 0) {
    await db.insert(careerMilestonesTable).values(values);
  }

  revalidatePath("/dashboard/career-plan");
}

// ─── Generate default WDB milestone templates ─────────────────────────────────

/**
 * Returns a pre-populated set of milestone templates based on a learner's
 * intended WDB goal area. Used to seed the career plan builder.
 */
export function generateWdbMilestoneTemplates(
  primaryGoal: WdbGoalCategory,
  targetCredential?: string
): WdbAlignedMilestone[] {
  const today = new Date();
  const inMonths = (n: number) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + n);
    return d.toISOString().split("T")[0];
  };

  const baseTemplates: Record<WdbGoalCategory, WdbAlignedMilestone[]> = {
    "Occupational Skills Training": [
      {
        title: `Enroll in ${targetCredential ?? "occupational skills program"}`,
        description: "Research, apply, and confirm enrollment in your chosen training program.",
        category: "Occupational Skills Training",
        targetDate: inMonths(1),
      },
      {
        title: "Complete 50% of coursework",
        description: "Reach the halfway point of your occupational skills training.",
        category: "Occupational Skills Training",
        targetDate: inMonths(3),
      },
      {
        title: `Complete ${targetCredential ?? "training program"} and obtain credential`,
        description: "Finish all coursework and receive your certificate or credential.",
        category: "Credential / Certification Completion",
        targetDate: inMonths(6),
      },
    ],
    "On-the-Job Training (OJT)": [
      {
        title: "Secure OJT placement with employer partner",
        description: "Connect with a WDB employer partner and confirm OJT agreement.",
        category: "On-the-Job Training (OJT)",
        targetDate: inMonths(1),
      },
      {
        title: "Complete 90-day OJT evaluation",
        description: "Pass the mid-point performance review with your OJT employer.",
        category: "On-the-Job Training (OJT)",
        targetDate: inMonths(4),
      },
      {
        title: "Convert OJT to permanent employment",
        description: "Negotiate and confirm a full-time offer upon OJT completion.",
        category: "Employment Placement",
        targetDate: inMonths(6),
      },
    ],
    "Employment Placement": [
      {
        title: "Update resume and LinkedIn profile",
        description: "Create a polished, targeted resume with accomplishment-based bullet points.",
        category: "Job Search Assistance",
        targetDate: inMonths(0),
      },
      {
        title: "Complete 10 job applications",
        description: "Apply to at least 10 positions aligned with your target occupation.",
        category: "Employment Placement",
        targetDate: inMonths(1),
      },
      {
        title: "Accept job offer",
        description: "Secure and accept a qualifying employment offer.",
        category: "Employment Placement",
        targetDate: inMonths(3),
      },
      {
        title: "Reach 90-day employment retention milestone",
        description: "Maintain employment for 90+ days (WIOA performance metric).",
        category: "Wage Progression",
        targetDate: inMonths(6),
      },
    ],
    "Credential / Certification Completion": [
      {
        title: "Register for certification exam",
        description: "Schedule and pay for your target certification exam.",
        category: "Credential / Certification Completion",
        targetDate: inMonths(1),
      },
      {
        title: "Complete exam preparation",
        description: "Study, take practice tests, and confirm readiness.",
        category: "Credential / Certification Completion",
        targetDate: inMonths(2),
      },
      {
        title: `Pass ${targetCredential ?? "certification"} exam`,
        description: "Take and pass the certification exam on the first attempt.",
        category: "Credential / Certification Completion",
        targetDate: inMonths(3),
      },
    ],
    "Basic Skills / Adult Education": [
      {
        title: "Enroll in adult education or ESL class",
        description: "Register with a WDB-approved adult education provider.",
        category: "Basic Skills / Adult Education",
        targetDate: inMonths(0),
      },
      {
        title: "Complete foundational skills assessment",
        description: "Take the TABE or CASAS assessment to establish a baseline.",
        category: "Basic Skills / Adult Education",
        targetDate: inMonths(1),
      },
      {
        title: "Advance one educational functioning level",
        description: "Progress to the next TABE/CASAS NRS level (WIOA performance metric).",
        category: "Basic Skills / Adult Education",
        targetDate: inMonths(6),
      },
    ],
    "GED / HiSET Attainment": [
      {
        title: "Enroll in GED/HiSET preparation program",
        description: "Register with an approved test prep program.",
        category: "GED / HiSET Attainment",
        targetDate: inMonths(0),
      },
      {
        title: "Pass all subject tests",
        description: "Pass all required GED or HiSET subject area tests.",
        category: "GED / HiSET Attainment",
        targetDate: inMonths(4),
      },
    ],
    "Work Experience / Internship": [
      {
        title: "Complete work experience application",
        description: "Apply for a WDB-sponsored work experience or internship placement.",
        category: "Work Experience / Internship",
        targetDate: inMonths(0),
      },
      {
        title: "Complete work experience assignment",
        description: "Finish your placement hours and receive supervisor evaluation.",
        category: "Work Experience / Internship",
        targetDate: inMonths(3),
      },
    ],
    "Job Search Assistance": [
      {
        title: "Attend job search workshop",
        description: "Participate in a WDB-sponsored job search skills workshop.",
        category: "Job Search Assistance",
        targetDate: inMonths(0),
      },
      {
        title: "Apply to 5 positions per week for 4 weeks",
        description: "Conduct active, documented job search activity.",
        category: "Job Search Assistance",
        targetDate: inMonths(1),
      },
    ],
    "Wage Progression": [
      {
        title: "Document current wage and target wage",
        description: "Baseline your current pay and set a 12-month wage goal.",
        category: "Wage Progression",
        targetDate: inMonths(0),
      },
      {
        title: "Request performance review / raise",
        description: "Schedule a formal performance review with your employer.",
        category: "Wage Progression",
        targetDate: inMonths(6),
      },
    ],
    "Career Advancement": [
      {
        title: "Identify promotion requirements",
        description: "Document the skills, credentials, and experience needed for your target role.",
        category: "Career Advancement",
        targetDate: inMonths(0),
      },
      {
        title: "Achieve target promotion",
        description: "Apply for and secure the target position or title change.",
        category: "Career Advancement",
        targetDate: inMonths(12),
      },
    ],
    "Supportive Services": [
      {
        title: "Assess supportive service needs",
        description: "Meet with your WDB case manager to identify transportation, childcare, or other support needs.",
        category: "Supportive Services",
        targetDate: inMonths(0),
      },
    ],
    "Registered Apprenticeship": [
      {
        title: "Apply to registered apprenticeship program",
        description: "Submit application to a DOL-registered apprenticeship.",
        category: "Registered Apprenticeship",
        targetDate: inMonths(1),
      },
      {
        title: "Complete Related Technical Instruction (RTI) — Year 1",
        description: "Finish first-year classroom/online training component.",
        category: "Registered Apprenticeship",
        targetDate: inMonths(12),
      },
      {
        title: "Complete apprenticeship and receive journeyworker credential",
        description: "Finish all hours and exams to receive the journeyworker certificate.",
        category: "Registered Apprenticeship",
        targetDate: inMonths(36),
      },
    ],
  };

  return baseTemplates[primaryGoal] ?? [];
}
