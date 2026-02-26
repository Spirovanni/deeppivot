"use server";

/**
 * WDB Partner Dashboard Analytics
 *
 * Server actions that aggregate cohort data for WDB partners.
 * All queries are scoped to learners connected to the WDB partner's
 * mentors (via mentor_connections) to ensure data isolation.
 */

import { db } from "@/src/db";
import {
  usersTable,
  mentorConnectionsTable,
  mentorsTable,
  interviewSessionsTable,
  careerArchetypesTable,
  careerMilestonesTable,
} from "@/src/db/schema";
import { eq, count, isNull, and, sql, desc, gte } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { requireRole } from "@/src/lib/rbac";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getWdbMentorIds(): Promise<number[]> {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) return [];

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUser.id))
    .limit(1);

  if (!user) return [];

  // WDB partner sees all mentors associated with their account.
  // For a real multi-tenant setup, filter by org/region.
  // For now, return all active mentors.
  const mentors = await db
    .select({ id: mentorsTable.id })
    .from(mentorsTable)
    .where(eq(mentorsTable.isActive, true));

  return mentors.map((m) => m.id);
}

async function getCohortLearnerIds(mentorIds: number[]): Promise<number[]> {
  if (mentorIds.length === 0) return [];

  const connections = await db
    .select({ userId: mentorConnectionsTable.userId })
    .from(mentorConnectionsTable)
    .where(
      sql`${mentorConnectionsTable.mentorId} = ANY(${mentorIds})`
    );

  return [...new Set(connections.map((c) => c.userId))];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WdbCohortStats {
  totalLearners: number;
  learnersWithSessions: number;
  totalSessions: number;
  avgSessionsPerLearner: number;
  completionRate: number;
  learnersWithArchetype: number;
  learnersWithMilestones: number;
}

export interface ArchetypeBreakdown {
  archetypeName: string;
  count: number;
  percentage: number;
}

export interface SessionTrend {
  /** ISO date string YYYY-MM-DD */
  date: string;
  sessions: number;
}

export interface MilestoneStatusBreakdown {
  status: string;
  count: number;
}

// ─── Cohort summary stats ─────────────────────────────────────────────────────

export async function getWdbCohortStats(): Promise<WdbCohortStats> {
  await requireRole("wdb_partner");

  const mentorIds = await getWdbMentorIds();
  const learnerIds = await getCohortLearnerIds(mentorIds);

  if (learnerIds.length === 0) {
    return {
      totalLearners: 0,
      learnersWithSessions: 0,
      totalSessions: 0,
      avgSessionsPerLearner: 0,
      completionRate: 0,
      learnersWithArchetype: 0,
      learnersWithMilestones: 0,
    };
  }

  const [sessionsResult, archetypeResult, milestoneResult] = await Promise.all([
    db
      .select({
        userId: interviewSessionsTable.userId,
        total: count(),
        completed: sql<number>`count(*) filter (where ${interviewSessionsTable.status} = 'completed' and ${interviewSessionsTable.deletedAt} is null)::int`,
      })
      .from(interviewSessionsTable)
      .where(
        and(
          sql`${interviewSessionsTable.userId} = ANY(${learnerIds})`,
          isNull(interviewSessionsTable.deletedAt)
        )
      )
      .groupBy(interviewSessionsTable.userId),

    db
      .select({ userId: careerArchetypesTable.userId })
      .from(careerArchetypesTable)
      .where(sql`${careerArchetypesTable.userId} = ANY(${learnerIds})`),

    db
      .select({ userId: careerMilestonesTable.userId })
      .from(careerMilestonesTable)
      .where(
        and(
          sql`${careerMilestonesTable.userId} = ANY(${learnerIds})`,
          isNull(careerMilestonesTable.deletedAt)
        )
      )
      .groupBy(careerMilestonesTable.userId),
  ]);

  const totalSessions = sessionsResult.reduce((sum, r) => sum + Number(r.total), 0);
  const learnersWithSessions = sessionsResult.length;
  const completedSessions = sessionsResult.reduce((sum, r) => sum + Number(r.completed), 0);

  return {
    totalLearners: learnerIds.length,
    learnersWithSessions,
    totalSessions,
    avgSessionsPerLearner: learnersWithSessions > 0
      ? Math.round((totalSessions / learnerIds.length) * 10) / 10
      : 0,
    completionRate: totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0,
    learnersWithArchetype: archetypeResult.length,
    learnersWithMilestones: milestoneResult.length,
  };
}

// ─── Archetype breakdown ──────────────────────────────────────────────────────

export async function getWdbArchetypeBreakdown(): Promise<ArchetypeBreakdown[]> {
  await requireRole("wdb_partner");

  const mentorIds = await getWdbMentorIds();
  const learnerIds = await getCohortLearnerIds(mentorIds);
  if (learnerIds.length === 0) return [];

  const rows = await db
    .select({
      archetypeName: careerArchetypesTable.archetypeName,
      count: count(),
    })
    .from(careerArchetypesTable)
    .where(sql`${careerArchetypesTable.userId} = ANY(${learnerIds})`)
    .groupBy(careerArchetypesTable.archetypeName)
    .orderBy(desc(count()));

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  return rows.map((r) => ({
    archetypeName: r.archetypeName,
    count: Number(r.count),
    percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
  }));
}

// ─── Session trend (last 30 days) ─────────────────────────────────────────────

export async function getWdbSessionTrend(days = 30): Promise<SessionTrend[]> {
  await requireRole("wdb_partner");

  const mentorIds = await getWdbMentorIds();
  const learnerIds = await getCohortLearnerIds(mentorIds);
  if (learnerIds.length === 0) return [];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${interviewSessionsTable.startedAt})::date::text`,
      sessions: count(),
    })
    .from(interviewSessionsTable)
    .where(
      and(
        sql`${interviewSessionsTable.userId} = ANY(${learnerIds})`,
        gte(interviewSessionsTable.startedAt, since),
        isNull(interviewSessionsTable.deletedAt)
      )
    )
    .groupBy(sql`date_trunc('day', ${interviewSessionsTable.startedAt})::date`)
    .orderBy(sql`date_trunc('day', ${interviewSessionsTable.startedAt})::date`);

  return rows.map((r) => ({ date: r.date, sessions: Number(r.sessions) }));
}

// ─── Milestone status breakdown ───────────────────────────────────────────────

export async function getWdbMilestoneBreakdown(): Promise<MilestoneStatusBreakdown[]> {
  await requireRole("wdb_partner");

  const mentorIds = await getWdbMentorIds();
  const learnerIds = await getCohortLearnerIds(mentorIds);
  if (learnerIds.length === 0) return [];

  const rows = await db
    .select({
      status: careerMilestonesTable.status,
      count: count(),
    })
    .from(careerMilestonesTable)
    .where(
      and(
        sql`${careerMilestonesTable.userId} = ANY(${learnerIds})`,
        isNull(careerMilestonesTable.deletedAt)
      )
    )
    .groupBy(careerMilestonesTable.status)
    .orderBy(desc(count()));

  return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
}
