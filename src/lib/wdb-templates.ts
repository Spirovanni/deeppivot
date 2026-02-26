/**
 * WDB milestone templates and constants — pure client-safe module.
 *
 * Intentionally NOT a server action file so client components can import
 * these types and helpers directly without violating Next.js server/client rules.
 */

// ─── Goal categories ──────────────────────────────────────────────────────────

/**
 * Standard WDB goal categories per WIOA Individual Employment Plan (IEP).
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WdbAlignedMilestone {
  title: string;
  description: string;
  category: WdbGoalCategory;
  targetDate?: string;
}

// ─── Template generator ───────────────────────────────────────────────────────

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
        description:
          "Meet with your WDB case manager to identify transportation, childcare, or other support needs.",
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
