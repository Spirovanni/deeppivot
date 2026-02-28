"use server";

import { db } from "@/src/db";
import { mentorsTable, mentorConnectionsTable, usersTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendMentorConnectionEmail } from "@/src/lib/email";

// ─── Seed data (12 mentor profiles) ─────────────────────────────────────────

const SEED_MENTORS = [
  {
    name: "Sarah Chen",
    title: "Principal Engineer",
    industry: "Technology",
    expertise: ["Software Engineering", "System Design", "Career Growth"],
    bio: "15 years building distributed systems at companies including Meta, Google, and early-stage startups. Passionate about helping engineers navigate the transition from IC to tech lead. I focus on practical advice around system design, career ladders, and finding your voice in cross-functional teams.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Marcus Johnson",
    title: "VP of Product",
    industry: "Technology",
    expertise: ["Product Management", "FinTech", "Go-to-Market"],
    bio: "Led product at Stripe, Square, and two acquired startups. I help aspiring PMs break in, sharpen their craft, and find product roles that align with their strengths. Especially interested in mentoring people transitioning into product from engineering or design backgrounds.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Priya Patel",
    title: "Head of Data Science",
    industry: "Technology",
    expertise: ["Data Science", "Machine Learning", "Analytics"],
    bio: "Built and scaled data science teams at Airbnb and Lyft. I mentor early-career data scientists on navigating the gap between academic ML and real-world production systems, as well as helping senior ICs make the leap into leadership roles in data.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "James Okafor",
    title: "Investment Director",
    industry: "Finance",
    expertise: ["Venture Capital", "Startup Funding", "Financial Modeling"],
    bio: "Investor at a top-tier VC firm with a focus on Series A/B enterprise software. Previously investment banking at Goldman Sachs. I mentor founders on fundraising strategy, pitch deck structure, and what investors actually look for during due diligence.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Elena Rodriguez",
    title: "Chief Medical Officer",
    industry: "Healthcare",
    expertise: ["Health Tech", "Clinical Operations", "Executive Leadership"],
    bio: "CMO with 20+ years spanning hospital systems and health-tech startups. I help clinical professionals transition into health-tech roles and advise healthcare executives on change management, digital transformation, and building patient-centered organizations.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "David Kim",
    title: "Head of Design",
    industry: "Design & Creative",
    expertise: ["UX/UI Design", "Design Systems", "Design Leadership"],
    bio: "Former Head of Design at Figma and Dropbox. I mentor designers at all levels — from portfolio reviews for junior designers to organizational strategy for design directors. Particular interest in helping designers develop their business acumen and advocate for their craft.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Aisha Thompson",
    title: "VP of People",
    industry: "People & Talent",
    expertise: ["HR Strategy", "DEI", "Organizational Development"],
    bio: "Built People functions from scratch at Shopify, Notion, and two YC startups. I coach HR professionals and founders on building equitable hiring systems, DEI strategy that actually moves metrics, and how to scale culture while maintaining authenticity.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Robert Walsh",
    title: "Head of Growth",
    industry: "Education",
    expertise: ["EdTech", "Growth Marketing", "User Acquisition"],
    bio: "Spent a decade in EdTech at Duolingo, Coursera, and Khan Academy. I mentor growth marketers and EdTech founders on building acquisition loops that work for learners, retention strategies specific to education products, and mission-driven company building.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Nina Okonkwo",
    title: "Director of Impact",
    industry: "Social Impact",
    expertise: ["Non-profit Management", "Community Building", "Social Entrepreneurship"],
    bio: "15 years in social sector leadership across education, economic mobility, and workforce development. I mentor social entrepreneurs, non-profit leaders, and mission-driven professionals on impact measurement, program design, and sustainable organizational models.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Carlos Mendez",
    title: "Staff ML Engineer",
    industry: "Technology",
    expertise: ["Machine Learning", "Cloud Architecture", "MLOps"],
    bio: "Staff Engineer at Google working on large-scale ML infrastructure. I mentor engineers interested in moving into ML/AI, with a focus on the practical engineering side — MLOps, model deployment, and the systems design skills that differentiate mid-level from senior ML engineers.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Yuki Tanaka",
    title: "Global Brand Director",
    industry: "Marketing",
    expertise: ["Brand Strategy", "Content Marketing", "Creative Direction"],
    bio: "Built brand strategy for Nike, LVMH, and a handful of DTC brands that scaled to $100M+. I mentor brand strategists, content creators, and marketing leads on articulating brand voice, building content systems at scale, and presenting creative work to skeptical executives.",
    linkedinUrl: "https://linkedin.com",
  },
  {
    name: "Rachel Goldberg",
    title: "FinTech Founder & Advisor",
    industry: "Finance",
    expertise: ["FinTech", "Personal Finance", "Entrepreneurship"],
    bio: "Founded and sold two FinTech startups. Now advising a portfolio of 12 early-stage companies. I focus on mentoring first-time founders in regulated industries — helping them navigate compliance, build financial models investors trust, and find product-market fit in a sector where trust is everything.",
    linkedinUrl: "https://linkedin.com",
  },
];

export async function seedMentors(): Promise<void> {
  const existing = await db.select({ id: mentorsTable.id }).from(mentorsTable).limit(1);
  if (existing.length > 0) return; // already seeded

  await db.insert(mentorsTable).values(SEED_MENTORS);
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function getMentors() {
  return db
    .select()
    .from(mentorsTable)
    .where(eq(mentorsTable.isActive, true));
}

// ─── Connection actions ───────────────────────────────────────────────────────

async function getDbUserId(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function requestConnection(
  mentorId: number,
  message?: string
): Promise<void> {
  const userId = await getDbUserId();

  // Upsert: if row exists, update message; otherwise insert
  const [existing] = await db
    .select({ id: mentorConnectionsTable.id })
    .from(mentorConnectionsTable)
    .where(
      and(
        eq(mentorConnectionsTable.userId, userId),
        eq(mentorConnectionsTable.mentorId, mentorId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(mentorConnectionsTable).values({
      userId,
      mentorId,
      status: "pending",
      message: message ?? null,
    });

    // Fetch mentor and learner details for the email
    const [mentorUser] = await db
      .select({
        mentorName: mentorsTable.name,
        mentorEmail: usersTable.email
      })
      .from(mentorsTable)
      .leftJoin(usersTable, eq(mentorsTable.userId, usersTable.id))
      .where(eq(mentorsTable.id, mentorId))
      .limit(1);

    const [learnerUser] = await db
      .select({ learnerName: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (mentorUser?.mentorEmail && learnerUser) {
      // Send the request email to the mentor asynchronously
      sendMentorConnectionEmail(mentorUser.mentorEmail, {
        type: "request",
        learnerName: learnerUser.learnerName,
        mentorName: mentorUser.mentorName,
        message: message,
      }).catch((err) => {
        console.error("Failed to send mentor connection request email:", err);
      });
    }
  }

  revalidatePath("/dashboard/mentors");
}

export async function updateConnectionStatus(
  connectionId: number,
  status: "pending" | "accepted" | "declined"
): Promise<void> {
  // We don't strictly require a specific role here as both mentors and admins might use it,
  // but we should verify the user is logged in.
  await getDbUserId();

  const [connection] = await db
    .update(mentorConnectionsTable)
    .set({ status })
    .where(eq(mentorConnectionsTable.id, connectionId))
    .returning();

  if (!connection) {
    throw new Error("Connection not found");
  }

  if (status === "accepted") {
    // Fetch details for the email
    const [learnerUser] = await db
      .select({ learnerName: usersTable.name, learnerEmail: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, connection.userId))
      .limit(1);

    const [mentorUser] = await db
      .select({ mentorName: mentorsTable.name })
      .from(mentorsTable)
      .where(eq(mentorsTable.id, connection.mentorId))
      .limit(1);

    if (learnerUser?.learnerEmail && mentorUser) {
      // Send the accepted email to the learner asynchronously
      sendMentorConnectionEmail(learnerUser.learnerEmail, {
        type: "accepted",
        learnerName: learnerUser.learnerName,
        mentorName: mentorUser.mentorName,
      }).catch((err) => {
        console.error("Failed to send mentor connection accepted email:", err);
      });
    }
  }

  revalidatePath("/dashboard/mentors");
}

export async function getUserConnections() {
  const userId = await getDbUserId();
  return db
    .select()
    .from(mentorConnectionsTable)
    .where(eq(mentorConnectionsTable.userId, userId));
}
