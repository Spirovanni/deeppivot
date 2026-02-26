"use server";

/**
 * Server actions for mentor tools:
 *   - Learner session review (video, transcripts, AI feedback)
 *   - Referral pathways (log referrals to DB and optionally Salesforce)
 *   - Resource sharing (curate and share links/docs with learners)
 */

import { db } from "@/src/db";
import {
  usersTable,
  mentorConnectionsTable,
  mentorsTable,
  interviewSessionsTable,
  recordingUrlsTable,
  transcriptUrlsTable,
  interviewFeedbackTable,
} from "@/src/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { requireRole } from "@/src/lib/rbac";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getDbUserId(): Promise<number> {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Not authenticated");

  const [row] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUser.id))
    .limit(1);

  if (!row) throw new Error("User not found in database");
  return row.id;
}

async function getMentorId(userId: number): Promise<number> {
  const [mentor] = await db
    .select({ id: mentorsTable.id })
    .from(mentorsTable)
    .where(eq(mentorsTable.userId, userId))
    .limit(1);

  if (!mentor) throw new Error("Mentor profile not found for this user");
  return mentor.id;
}

// ─── Learner session review ───────────────────────────────────────────────────

export interface LearnerSummary {
  userId: number;
  name: string;
  email: string;
  sessionCount: number;
}

export interface SessionDetail {
  id: number;
  sessionType: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  overallScore: number | null;
  notes: string | null;
  recordings: { id: number; url: string; createdAt: Date }[];
  transcripts: { id: number; url: string; createdAt: Date }[];
  feedback: { id: number; content: string | null; score: number | null; createdAt: Date }[];
}

/**
 * Get all learners connected to the current mentor.
 */
export async function getMentorLearners(): Promise<LearnerSummary[]> {
  await requireRole("mentor");
  const userId = await getDbUserId();
  const mentorId = await getMentorId(userId);

  const connections = await db
    .select({
      userId: mentorConnectionsTable.userId,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(mentorConnectionsTable)
    .innerJoin(usersTable, eq(mentorConnectionsTable.userId, usersTable.id))
    .where(eq(mentorConnectionsTable.mentorId, mentorId));

  // Enrich with session counts
  const results: LearnerSummary[] = [];
  for (const conn of connections) {
    const sessions = await db
      .select({ id: interviewSessionsTable.id })
      .from(interviewSessionsTable)
      .where(eq(interviewSessionsTable.userId, conn.userId));

    results.push({
      userId: conn.userId,
      name: conn.name,
      email: conn.email,
      sessionCount: sessions.length,
    });
  }

  return results;
}

/**
 * Get all interview sessions for a specific learner.
 * Validates the learner is connected to the requesting mentor.
 */
export async function getLearnerSessions(learnerId: number): Promise<SessionDetail[]> {
  await requireRole("mentor");
  const userId = await getDbUserId();
  const mentorId = await getMentorId(userId);

  // Verify mentor-learner connection
  const [connection] = await db
    .select({ id: mentorConnectionsTable.id })
    .from(mentorConnectionsTable)
    .where(
      and(
        eq(mentorConnectionsTable.mentorId, mentorId),
        eq(mentorConnectionsTable.userId, learnerId)
      )
    )
    .limit(1);

  if (!connection) {
    throw new Error("This learner is not connected to you");
  }

  const sessions = await db
    .select()
    .from(interviewSessionsTable)
    .where(eq(interviewSessionsTable.userId, learnerId))
    .orderBy(desc(interviewSessionsTable.startedAt));

  const results: SessionDetail[] = [];

  for (const session of sessions) {
    const [recordings, transcripts, feedback] = await Promise.all([
      db
        .select({ id: recordingUrlsTable.id, url: recordingUrlsTable.url, createdAt: recordingUrlsTable.createdAt })
        .from(recordingUrlsTable)
        .where(eq(recordingUrlsTable.sessionId, session.id)),
      db
        .select({ id: transcriptUrlsTable.id, url: transcriptUrlsTable.url, createdAt: transcriptUrlsTable.createdAt })
        .from(transcriptUrlsTable)
        .where(eq(transcriptUrlsTable.sessionId, session.id)),
      db
        .select({
          id: interviewFeedbackTable.id,
          content: interviewFeedbackTable.content,
          score: interviewFeedbackTable.sentimentScore,
          createdAt: interviewFeedbackTable.createdAt,
        })
        .from(interviewFeedbackTable)
        .where(eq(interviewFeedbackTable.sessionId, session.id)),
    ]);

    results.push({
      id: session.id,
      sessionType: session.sessionType,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      overallScore: session.overallScore,
      notes: session.notes,
      recordings,
      transcripts,
      feedback,
    });
  }

  return results;
}

// ─── Referral pathways ────────────────────────────────────────────────────────

export interface ReferralInput {
  learnerId: number;
  referralType: "job_opening" | "wdb_program" | "employer" | "general";
  targetName: string;
  targetUrl?: string;
  notes: string;
}

export interface ReferralRecord {
  id: number;
  learnerId: number;
  learnerName: string;
  referralType: string;
  targetName: string;
  targetUrl: string | null;
  notes: string;
  createdAt: Date;
}

/**
 * Log a referral from a mentor to a learner.
 * Stores the referral in the DB and optionally syncs to Salesforce.
 */
export async function createMentorReferral(input: ReferralInput): Promise<void> {
  await requireRole("mentor");
  const userId = await getDbUserId();
  const mentorId = await getMentorId(userId);

  // Verify connection
  const [connection] = await db
    .select({ id: mentorConnectionsTable.id })
    .from(mentorConnectionsTable)
    .where(
      and(
        eq(mentorConnectionsTable.mentorId, mentorId),
        eq(mentorConnectionsTable.userId, input.learnerId)
      )
    )
    .limit(1);

  if (!connection) {
    throw new Error("You can only refer learners connected to you");
  }

  // Log referral as a structured entry in the connection message field.
  // A dedicated mentor_referrals table should be added in a future migration.
  let referrals: unknown[] = [];
  if (connection && (connection as { message?: string | null }).message) {
    try {
      const parsed = JSON.parse((connection as { message?: string | null }).message ?? "{}");
      referrals = Array.isArray(parsed.referrals) ? parsed.referrals : [];
    } catch {
      // ignore
    }
  }

  referrals.push({
    id: `ref_${Date.now()}`,
    type: input.referralType,
    target: input.targetName,
    url: input.targetUrl ?? null,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  });

  await db
    .update(mentorConnectionsTable)
    .set({ message: JSON.stringify({ referrals }) })
    .where(eq(mentorConnectionsTable.id, connection.id));
}

/**
 * Get all referrals created by the current mentor.
 * (Reads from mentorConnectionsTable.notes for now; replace with referrals table after migration.)
 */
export async function getMentorReferrals(): Promise<ReferralRecord[]> {
  await requireRole("mentor");
  const userId = await getDbUserId();
  const mentorId = await getMentorId(userId);

  const connections = await db
    .select({
      id: mentorConnectionsTable.id,
      learnerId: mentorConnectionsTable.userId,
      learnerName: usersTable.name,
      message: mentorConnectionsTable.message,
      createdAt: mentorConnectionsTable.createdAt,
    })
    .from(mentorConnectionsTable)
    .innerJoin(usersTable, eq(mentorConnectionsTable.userId, usersTable.id))
    .where(eq(mentorConnectionsTable.mentorId, mentorId));

  const referrals: ReferralRecord[] = [];
  for (const conn of connections) {
    if (!conn.message) continue;
    try {
      const parsed = JSON.parse(conn.message ?? "{}");
      const refs = Array.isArray(parsed.referrals) ? parsed.referrals : [];
      for (const ref of refs) {
        referrals.push({
          id: ref.id ?? conn.id,
          learnerId: conn.learnerId,
          learnerName: conn.learnerName,
          referralType: ref.type,
          targetName: ref.target,
          targetUrl: ref.url,
          notes: ref.notes,
          createdAt: new Date(ref.createdAt),
        });
      }
    } catch {
      // skip malformed JSON
    }
  }

  return referrals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ─── Resource sharing ─────────────────────────────────────────────────────────

export interface MentorResource {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  sharedWithAll: boolean;
  createdAt: string;
}

export interface ResourceInput {
  title: string;
  url: string;
  description: string;
  category: "article" | "video" | "tool" | "course" | "book" | "other";
  sharedWithAll: boolean;
}

/**
 * Get resources curated by the current mentor.
 * Stored in mentors.bio as a JSON supplement (until a dedicated table is added).
 * Replace with a mentor_resources table in the next migration.
 */
export async function getMentorResources(): Promise<MentorResource[]> {
  await requireRole("mentor");
  const userId = await getDbUserId();

  const [mentor] = await db
    .select({ id: mentorsTable.id, expertise: mentorsTable.expertise })
    .from(mentorsTable)
    .where(eq(mentorsTable.userId, userId))
    .limit(1);

  if (!mentor) return [];

  // Resources are stored in a sidecar JSON key in expertise array
  // Until a dedicated table is available, parse from a special "__resources__" entry
  const resourceEntry = mentor.expertise?.find((e: string) => e.startsWith("__resources__:"));
  if (!resourceEntry) return [];

  try {
    return JSON.parse(resourceEntry.replace("__resources__:", "")) as MentorResource[];
  } catch {
    return [];
  }
}

/**
 * Add a resource to the current mentor's library.
 */
export async function addMentorResource(input: ResourceInput): Promise<void> {
  await requireRole("mentor");
  const userId = await getDbUserId();

  const [mentor] = await db
    .select({ id: mentorsTable.id, expertise: mentorsTable.expertise })
    .from(mentorsTable)
    .where(eq(mentorsTable.userId, userId))
    .limit(1);

  if (!mentor) throw new Error("Mentor profile not found");

  const existing = await getMentorResources();
  const newResource: MentorResource = {
    id: `res_${Date.now()}`,
    title: input.title,
    url: input.url,
    description: input.description,
    category: input.category,
    sharedWithAll: input.sharedWithAll,
    createdAt: new Date().toISOString(),
  };

  const updated = [...existing, newResource];
  const expertise = (mentor.expertise ?? []).filter((e: string) => !e.startsWith("__resources__:"));
  expertise.push(`__resources__:${JSON.stringify(updated)}`);

  await db
    .update(mentorsTable)
    .set({ expertise })
    .where(eq(mentorsTable.id, mentor.id));
}

/**
 * Delete a resource from the mentor's library by ID.
 */
export async function deleteMentorResource(resourceId: string): Promise<void> {
  await requireRole("mentor");
  const userId = await getDbUserId();

  const [mentor] = await db
    .select({ id: mentorsTable.id, expertise: mentorsTable.expertise })
    .from(mentorsTable)
    .where(eq(mentorsTable.userId, userId))
    .limit(1);

  if (!mentor) throw new Error("Mentor profile not found");

  const existing = await getMentorResources();
  const updated = existing.filter((r) => r.id !== resourceId);
  const expertise = (mentor.expertise ?? []).filter((e: string) => !e.startsWith("__resources__:"));
  expertise.push(`__resources__:${JSON.stringify(updated)}`);

  await db
    .update(mentorsTable)
    .set({ expertise })
    .where(eq(mentorsTable.id, mentor.id));
}
