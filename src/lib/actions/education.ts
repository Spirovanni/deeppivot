"use server";

import { db } from "@/src/db";
import {
  educationProgramsTable,
  fundingOpportunitiesTable,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_PROGRAMS = [
  // ── Bootcamps ──────────────────────────────────────────────────────────────
  {
    name: "Software Engineering Bootcamp",
    provider: "General Assembly",
    programType: "bootcamp",
    duration: "12 weeks",
    cost: 1495000, // $14,950
    roiScore: 82,
    tags: ["Full-Stack", "JavaScript", "React", "Python"],
    url: "https://generalassemb.ly",
    description:
      "An immersive, project-based program covering full-stack development with JavaScript, React, Python, and SQL. Graduates average a 30% salary increase within 6 months.",
  },
  {
    name: "Data Science Bootcamp",
    provider: "Flatiron School",
    programType: "bootcamp",
    duration: "15 weeks",
    cost: 1600000, // $16,000
    roiScore: 79,
    tags: ["Data Science", "Python", "Machine Learning", "Statistics"],
    url: "https://flatironschool.com",
    description:
      "Hands-on data science curriculum covering Python, statistical modeling, machine learning, and data visualisation. Includes career coaching and job guarantee.",
  },
  {
    name: "UX Design Bootcamp",
    provider: "CareerFoundry",
    programType: "bootcamp",
    duration: "6 months",
    cost: 690000, // $6,900
    roiScore: 75,
    tags: ["UX Design", "Figma", "User Research", "Prototyping"],
    url: "https://careerfoundry.com",
    description:
      "Self-paced UX design program with a dedicated mentor and tutor. Covers design thinking, Figma, usability testing, and building a professional portfolio.",
  },
  {
    name: "Cybersecurity Bootcamp",
    provider: "SANS Institute",
    programType: "bootcamp",
    duration: "4 months",
    cost: 800000, // $8,000
    roiScore: 88,
    tags: ["Cybersecurity", "Networking", "Ethical Hacking", "Compliance"],
    url: "https://sans.org",
    description:
      "Intensive cybersecurity training from the world's leading security training organisation. Covers network security, penetration testing, and incident response.",
  },
  {
    name: "Product Management Bootcamp",
    provider: "Product School",
    programType: "bootcamp",
    duration: "8 weeks",
    cost: 499900, // $4,999
    roiScore: 71,
    tags: ["Product Management", "Agile", "Roadmapping", "User Stories"],
    url: "https://productschool.com",
    description:
      "Part-time PM bootcamp taught by practising product managers from Google, Facebook, and Airbnb. Focus on real-world product strategy and execution.",
  },
  {
    name: "Full-Stack Web Development",
    provider: "App Academy",
    programType: "bootcamp",
    duration: "16 weeks",
    cost: 1700000, // $17,000 (or ISA)
    roiScore: 85,
    tags: ["Full-Stack", "Ruby on Rails", "JavaScript", "React", "SQL"],
    url: "https://appacademy.io",
    description:
      "One of the most rigorous coding bootcamps in the industry with a 93% job placement rate. Offers an ISA option — pay nothing until you're hired.",
  },
  {
    name: "Data Analytics Bootcamp",
    provider: "Springboard",
    programType: "bootcamp",
    duration: "6 months",
    cost: 990000, // $9,900
    roiScore: 77,
    tags: ["Data Analytics", "SQL", "Tableau", "Python"],
    url: "https://springboard.com",
    description:
      "Mentor-led data analytics course with a job guarantee. Covers SQL, Python, Tableau, and A/B testing with real-world capstone projects.",
  },
  {
    name: "iOS & Android Development",
    provider: "Thinkful",
    programType: "bootcamp",
    duration: "5 months",
    cost: 1600000, // $16,000
    roiScore: 74,
    tags: ["iOS", "Android", "Swift", "Kotlin", "Mobile"],
    url: "https://thinkful.com",
    description:
      "Mobile development bootcamp covering Swift for iOS and Kotlin for Android. Includes 1-on-1 mentorship and a dedicated career coach.",
  },
  // ── Certifications ─────────────────────────────────────────────────────────
  {
    name: "AWS Certified Solutions Architect",
    provider: "Amazon Web Services",
    programType: "certification",
    duration: "3 months (self-paced)",
    cost: 30000, // $300 exam fee
    roiScore: 91,
    tags: ["Cloud", "AWS", "Architecture", "DevOps"],
    url: "https://aws.amazon.com/certification",
    description:
      "One of the most valued cloud certifications in the market. Validates your ability to design distributed systems on AWS. Average salary bump: $18K+.",
  },
  {
    name: "Google Professional Data Engineer",
    provider: "Google Cloud",
    programType: "certification",
    duration: "2-3 months (self-paced)",
    cost: 20000, // $200 exam fee
    roiScore: 87,
    tags: ["Data Engineering", "GCP", "BigQuery", "Cloud"],
    url: "https://cloud.google.com/certification",
    description:
      "Validates expertise in designing, building, and operationalising data processing systems on Google Cloud Platform. Highly sought after in enterprise environments.",
  },
  {
    name: "Google Project Management Certificate",
    provider: "Google / Coursera",
    programType: "certification",
    duration: "6 months (10 hrs/week)",
    cost: 0, // free with financial aid
    roiScore: 68,
    tags: ["Project Management", "Agile", "Scrum", "PMP"],
    url: "https://grow.google/certificates",
    description:
      "A beginner-friendly, job-ready certificate for project management roles. No degree required. Includes hands-on projects and preparation for PMP certification.",
  },
  {
    name: "Certified Scrum Master (CSM)",
    provider: "Scrum Alliance",
    programType: "certification",
    duration: "2 days",
    cost: 129500, // $1,295
    roiScore: 72,
    tags: ["Scrum", "Agile", "Project Management", "Team Leadership"],
    url: "https://scrumalliance.org",
    description:
      "Industry-recognised Agile certification. Teaches Scrum theory, roles, events, and artefacts. Valuable for engineers, PMs, and team leads moving into agile organisations.",
  },
  {
    name: "CompTIA Security+",
    provider: "CompTIA",
    programType: "certification",
    duration: "3-4 months (self-paced)",
    cost: 39200, // $392 exam fee
    roiScore: 84,
    tags: ["Cybersecurity", "Networking", "Compliance", "Risk Management"],
    url: "https://comptia.org",
    description:
      "The most widely adopted entry-level cybersecurity certification. DoD-approved and recognised globally. Covers threats, cryptography, identity management, and risk.",
  },
  {
    name: "Certified Data Professional (CDP)",
    provider: "DAMA International",
    programType: "certification",
    duration: "Self-paced",
    cost: 45000, // $450
    roiScore: 70,
    tags: ["Data Management", "Data Governance", "Analytics"],
    url: "https://dama.org",
    description:
      "The premier certification for data management professionals. Covers all domains of the DAMA-DMBOK including data governance, architecture, and quality.",
  },
  {
    name: "Meta Front-End Developer Certificate",
    provider: "Meta / Coursera",
    programType: "certification",
    duration: "7 months (6 hrs/week)",
    cost: 0,
    roiScore: 66,
    tags: ["Front-End", "React", "JavaScript", "HTML/CSS"],
    url: "https://coursera.org/professional-certificates/meta-front-end-developer",
    description:
      "Official Meta-backed certificate covering front-end development with React, JavaScript, and responsive design. No experience required.",
  },
  {
    name: "IBM Data Science Professional Certificate",
    provider: "IBM / Coursera",
    programType: "certification",
    duration: "11 months (3 hrs/week)",
    cost: 0,
    roiScore: 73,
    tags: ["Data Science", "Python", "Machine Learning", "SQL"],
    url: "https://coursera.org/professional-certificates/ibm-data-science",
    description:
      "Comprehensive data science programme from IBM covering Python, SQL, data visualisation, machine learning, and Applied Data Science capstone.",
  },
  // ── Free / Open platforms ───────────────────────────────────────────────────
  {
    name: "Responsive Web Design",
    provider: "freeCodeCamp",
    programType: "certification",
    duration: "300 hours",
    cost: 0,
    roiScore: 55,
    tags: ["HTML", "CSS", "Responsive Design", "Accessibility"],
    url: "https://freecodecamp.org",
    description:
      "Free, self-paced web development curriculum. Covers HTML5, CSS3, Flexbox, Grid, and accessibility. Earn a verifiable certification at no cost.",
  },
  {
    name: "Full-Stack JavaScript Developer",
    provider: "The Odin Project",
    programType: "certification",
    duration: "12-18 months (self-paced)",
    cost: 0,
    roiScore: 63,
    tags: ["Full-Stack", "JavaScript", "Node.js", "React", "PostgreSQL"],
    url: "https://theodinproject.com",
    description:
      "A completely free open-source curriculum for learning full-stack web development. Project-based learning with a strong community. Highly respected by hiring managers.",
  },
  // ── Degrees ─────────────────────────────────────────────────────────────────
  {
    name: "Online B.S. in Computer Science",
    provider: "Western Governors University",
    programType: "degree",
    duration: "3-4 years",
    cost: 790000, // ~$7,900/year
    roiScore: 89,
    tags: ["Computer Science", "Software Engineering", "Degree", "ABET-Accredited"],
    url: "https://wgu.edu",
    description:
      "Competency-based online bachelor's degree in CS. Flat-rate tuition allows motivated students to graduate faster. ABET-accredited and highly regarded by employers.",
  },
  {
    name: "Online M.S. in Data Science",
    provider: "Georgia Institute of Technology",
    programType: "degree",
    duration: "2-3 years",
    cost: 1000000, // ~$10K total
    roiScore: 94,
    tags: ["Data Science", "Machine Learning", "Graduate Degree", "Research"],
    url: "https://omscs.gatech.edu",
    description:
      "One of the most prestigious and affordable online master's programmes globally. Georgia Tech's OMSA/OMSCS covers machine learning, computational data analytics, and more.",
  },
  {
    name: "Online MBA",
    provider: "University of Illinois (iMBA)",
    programType: "degree",
    duration: "2-3 years",
    cost: 2200000, // ~$22,000 total
    roiScore: 86,
    tags: ["MBA", "Business Strategy", "Leadership", "Finance"],
    url: "https://onlinemba.illinois.edu",
    description:
      "A top-ranked, fully accredited online MBA from a leading public university at a fraction of traditional MBA costs. Strong ROI for mid-career professionals.",
  },
  // ── Workshops ──────────────────────────────────────────────────────────────
  {
    name: "AI for Everyone",
    provider: "deeplearning.ai / Coursera",
    programType: "workshop",
    duration: "6 hours",
    cost: 0,
    roiScore: 58,
    tags: ["AI", "Non-Technical", "Strategy", "Leadership"],
    url: "https://deeplearning.ai",
    description:
      "Andrew Ng's non-technical introduction to AI strategy for business leaders and curious professionals. Understand what AI can and cannot do.",
  },
  {
    name: "Design Thinking for Innovation",
    provider: "IDEO U",
    programType: "workshop",
    duration: "4 weeks",
    cost: 99900, // $999
    roiScore: 65,
    tags: ["Design Thinking", "Innovation", "Problem Solving", "Creativity"],
    url: "https://ideou.com",
    description:
      "Learn the human-centred design process from IDEO, the world's leading design consultancy. Apply design thinking frameworks to real organisational challenges.",
  },
  {
    name: "Growth Marketing Certificate",
    provider: "Reforge",
    programType: "workshop",
    duration: "8 weeks",
    cost: 299500, // $2,995
    roiScore: 78,
    tags: ["Growth", "Marketing", "Retention", "Experimentation"],
    url: "https://reforge.com",
    description:
      "Practitioner-taught programme covering growth loops, retention modelling, and product-led growth. Taught by operators from Airbnb, Pinterest, and Dropbox.",
  },
  {
    name: "Negotiation Mastery",
    provider: "Harvard Online",
    programType: "workshop",
    duration: "7 weeks",
    cost: 269500, // $2,695
    roiScore: 74,
    tags: ["Negotiation", "Leadership", "Communication", "Salary"],
    url: "https://online.hbs.edu",
    description:
      "Based on Harvard Business School's Negotiation course. Develop negotiation strategies for job offers, contracts, and complex multi-party deals.",
  },
  {
    name: "Machine Learning Specialisation",
    provider: "Stanford / Coursera",
    programType: "certification",
    duration: "3 months (10 hrs/week)",
    cost: 0,
    roiScore: 83,
    tags: ["Machine Learning", "Python", "Neural Networks", "AI"],
    url: "https://coursera.org/specializations/machine-learning-introduction",
    description:
      "Andrew Ng's updated ML specialisation covering supervised/unsupervised learning, best practices, and building real ML systems. The industry standard starting point.",
  },
  {
    name: "Financial Modelling & Valuation",
    provider: "CFI (Corporate Finance Institute)",
    programType: "certification",
    duration: "4 months (self-paced)",
    cost: 49700, // $497
    roiScore: 80,
    tags: ["Finance", "Financial Modelling", "Valuation", "Excel"],
    url: "https://corporatefinanceinstitute.com",
    description:
      "Industry-recognised financial modelling certification covering DCF, LBO, M&A, and comparable analysis. Used by analysts at top investment banks.",
  },
  {
    name: "UX Research & Design",
    provider: "Nielsen Norman Group",
    programType: "certification",
    duration: "Self-paced",
    cost: 150000, // ~$1,500
    roiScore: 76,
    tags: ["UX Research", "Usability Testing", "Information Architecture"],
    url: "https://nngroup.com",
    description:
      "The world's most respected UX certification from the Nielsen Norman Group. Demonstrates rigorous grounding in evidence-based UX research methods.",
  },
];

const SEED_FUNDING = [
  {
    name: "Pell Grant",
    fundingType: "grant",
    amount: 745000, // $7,450 max
    eligibilityText:
      "U.S. citizens and eligible non-citizens with demonstrated financial need. Based on EFC from FAFSA. Available for accredited degree programmes.",
    applicationUrl: "https://studentaid.gov/understand-aid/types/grants/pell",
    deadline: null,
  },
  {
    name: "FAFSA Federal Student Loans",
    fundingType: "loan",
    amount: null, // varies
    eligibilityText:
      "U.S. citizens enrolled at least half-time at an accredited institution. Subsidised loans for undergrads with financial need; unsubsidised for all eligible students.",
    applicationUrl: "https://studentaid.gov/h/apply-for-aid/fafsa",
    deadline: null,
  },
  {
    name: "Flatiron School ISA",
    fundingType: "isa",
    amount: null, // income share
    eligibilityText:
      "Accepted Flatiron School bootcamp students in eligible programmes. Pay nothing upfront; share a percentage of income after landing a job above a salary threshold.",
    applicationUrl: "https://flatironschool.com/financing",
    deadline: null,
  },
  {
    name: "App Academy ISA",
    fundingType: "isa",
    amount: null,
    eligibilityText:
      "Accepted App Academy students. No upfront tuition. Income share agreement begins after employment with salary above $50K. Cap at 1.5× tuition.",
    applicationUrl: "https://appacademy.io/tuition",
    deadline: null,
  },
  {
    name: "Google Career Certificates Financial Aid",
    fundingType: "scholarship",
    amount: 0,
    eligibilityText:
      "Available to learners who cannot afford the Coursera subscription fee. Apply through Coursera's financial aid programme. Full access at no cost.",
    applicationUrl: "https://grow.google/certificates",
    deadline: null,
  },
  {
    name: "Scholarship America Dream Award",
    fundingType: "scholarship",
    amount: 500000, // up to $5,000
    eligibilityText:
      "U.S. citizens or permanent residents enrolled full-time at an accredited 2- or 4-year institution. Minimum GPA 3.0. Priority given to first-generation students.",
    applicationUrl: "https://scholarshipamerica.org/dream-award",
    deadline: new Date("2026-04-15"),
  },
  {
    name: "Work Opportunity Tax Credit (WOTC) Training Voucher",
    fundingType: "grant",
    amount: 240000, // up to $2,400
    eligibilityText:
      "Job seekers from targeted groups including veterans, ex-felons, and long-term unemployed. Employers claim the credit; some training providers pass value to participants.",
    applicationUrl: "https://dol.gov/agencies/eta/wotc",
    deadline: null,
  },
  {
    name: "WIOA Training Funds",
    fundingType: "grant",
    amount: null, // varies by state
    eligibilityText:
      "Adults and dislocated workers who meet income and employment eligibility requirements. Funded through the Workforce Innovation and Opportunity Act. Contact your local American Job Center.",
    applicationUrl: "https://careeronestop.org/LocalHelp/AmericanJobCenters",
    deadline: null,
  },
  {
    name: "Levin Institute Tech Talent Pipeline Scholarship",
    fundingType: "scholarship",
    amount: 1000000, // $10,000
    eligibilityText:
      "New York State residents enrolled in approved tech training programmes. Focus on underrepresented populations in tech. Must be seeking employment in NYC or NY State after completion.",
    applicationUrl: "https://ttpnyc.com",
    deadline: new Date("2026-05-01"),
  },
];

// ─── Seed helper ─────────────────────────────────────────────────────────────

export async function seedEducation(): Promise<void> {
  const [existingProgram] = await db
    .select({ id: educationProgramsTable.id })
    .from(educationProgramsTable)
    .limit(1);

  if (!existingProgram) {
    await db.insert(educationProgramsTable).values(SEED_PROGRAMS);
  }

  const [existingFunding] = await db
    .select({ id: fundingOpportunitiesTable.id })
    .from(fundingOpportunitiesTable)
    .limit(1);

  if (!existingFunding) {
    await db.insert(fundingOpportunitiesTable).values(SEED_FUNDING);
  }
}

// ─── Query actions ────────────────────────────────────────────────────────────

export async function getPrograms() {
  return db
    .select()
    .from(educationProgramsTable)
    .where(eq(educationProgramsTable.isActive, true));
}

export interface ProgramFilters {
  search?: string;
  programTypes?: string[];
  maxCostCents?: number;
  minRoiScore?: number;
  tags?: string[];
}

export async function getFilteredPrograms(filters: ProgramFilters = {}) {
  const { and, ilike, lte, gte, arrayOverlaps, sql } = await import("drizzle-orm");

  const conditions = [eq(educationProgramsTable.isActive, true)];

  if (filters.programTypes && filters.programTypes.length > 0) {
    const { inArray } = await import("drizzle-orm");
    conditions.push(
      inArray(educationProgramsTable.programType, filters.programTypes)
    );
  }

  if (filters.maxCostCents !== undefined) {
    conditions.push(lte(educationProgramsTable.cost, filters.maxCostCents));
  }

  if (filters.minRoiScore !== undefined) {
    conditions.push(gte(educationProgramsTable.roiScore, filters.minRoiScore));
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(
      sql`${educationProgramsTable.tags} && ${filters.tags}`
    );
  }

  let query = db
    .select()
    .from(educationProgramsTable)
    .where(and(...conditions));

  const results = await query;

  // Client-side text search (Neon HTTP doesn't support full-text easily without pg_trgm)
  if (filters.search && filters.search.trim()) {
    const term = filters.search.toLowerCase();
    return results.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.provider.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  return results;
}

export async function getFunding() {
  return db
    .select()
    .from(fundingOpportunitiesTable)
    .where(eq(fundingOpportunitiesTable.isActive, true));
}
