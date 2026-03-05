/**
 * Admin CSV export logic — shared by direct GET and signed-link download (deeppivot-313, deeppivot-312, deeppivot-314).
 */
import { db } from "@/src/db";
import {
    usersTable,
    userGamificationTable,
    interviewSessionsTable,
    jobsTable,
    companiesTable,
    jobMarketplaceApplicationsTable,
    jobMatchesTable,
    employerJobInvitationsTable,
} from "@/src/db/schema";
import { eq, isNull, and, sql, gte, lte, desc } from "drizzle-orm";

/** Escape CSV value: wrap in quotes, escape internal quotes */
function csvEscape(val: string | null | undefined): string {
  const s = String(val ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export interface UsersExportOptions {
  role?: string;
  includeDeleted?: boolean;
}

/** Generate users CSV content with gamification + WDB fields. */
export async function generateUsersCsv(options: UsersExportOptions = {}): Promise<string> {
  const { role: roleFilter, includeDeleted = false } = options;

  const conditions = [];
  if (roleFilter && roleFilter.length > 0) conditions.push(eq(usersTable.role, roleFilter));
  if (!includeDeleted) conditions.push(isNull(usersTable.deletedAt));

  const rows = await db
    .select({
      user: usersTable,
      points: userGamificationTable.points,
      currentStreak: userGamificationTable.currentStreak,
      highestStreak: userGamificationTable.highestStreak,
    })
    .from(usersTable)
    .leftJoin(userGamificationTable, eq(usersTable.id, userGamificationTable.userId))
    .where(conditions.length > 0 ? and(...conditions) : sql`true`);

  const headers = [
    "ID", "Clerk ID", "First Name", "Last Name", "Name", "Email", "Role", "Status", "Age",
    "Phone", "Pronouns", "Bio", "LinkedIn", "Credits", "Credits Used", "Credits Remaining",
    "Premium", "Suspended", "Deleted", "Deleted At", "Points", "Current Streak", "Highest Streak",
    "WDB Contact ID", "WDB Case Plan", "WDB Enrolled At", "Organization ID", "Created At", "Updated At",
  ];

  const dataRows = rows.map(({ user: u, points, currentStreak, highestStreak }) => [
    u.id,
    u.clerkId,
    csvEscape(u.firstName),
    csvEscape(u.lastName),
    csvEscape(u.name),
    csvEscape(u.email),
    u.role,
    u.status,
    u.age,
    csvEscape(u.phone),
    csvEscape(u.pronouns),
    csvEscape(u.bio?.slice(0, 500)),
    csvEscape(u.linkedinUrl),
    u.credits,
    u.creditsUsed,
    u.creditsRemaining,
    u.isPremium ? "Yes" : "No",
    u.isSuspended ? "Yes" : "No",
    u.isDeleted ? "Yes" : "No",
    u.deletedAt ? new Date(u.deletedAt).toISOString() : "",
    points ?? 0,
    currentStreak ?? 0,
    highestStreak ?? 0,
    csvEscape(u.wdbSalesforceContactId),
    csvEscape(u.wdbCasePlanId),
    u.wdbEnrolledAt ? new Date(u.wdbEnrolledAt).toISOString() : "",
    csvEscape(u.organizationId),
    new Date(u.createdAt).toISOString(),
    new Date(u.updatedAt).toISOString(),
  ]);

  return [headers.join(","), ...dataRows.map((r) => r.join(","))].join("\n");
}

export interface InterviewSessionsExportOptions {
  from?: string; // ISO date
  to?: string;   // ISO date
  includeDeleted?: boolean;
}

/** Generate interview sessions CSV with full columns (deeppivot-312). */
export async function generateInterviewSessionsCsv(
  options: InterviewSessionsExportOptions = {}
): Promise<string> {
  const { from, to, includeDeleted = false } = options;

  const conditions = [];
  if (!includeDeleted) conditions.push(isNull(interviewSessionsTable.deletedAt));
  if (from) conditions.push(gte(interviewSessionsTable.startedAt, new Date(from)));
  if (to) conditions.push(lte(interviewSessionsTable.startedAt, new Date(to)));

  const rows = await db
    .select({
      session: interviewSessionsTable,
      userEmail: usersTable.email,
      userName: usersTable.name,
    })
    .from(interviewSessionsTable)
    .leftJoin(usersTable, eq(interviewSessionsTable.userId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : sql`true`)
    .orderBy(desc(interviewSessionsTable.startedAt));

  const headers = [
    "Session ID", "User ID", "User Name", "User Email", "Job Description ID", "Resume ID",
    "Session Type", "Status", "Started At", "Ended At", "Overall Score", "Notes",
    "Organization ID", "Created At", "Updated At", "Deleted At",
  ];

  const dataRows = rows.map(({ session: s, userEmail, userName }) => [
    s.id,
    s.userId,
    csvEscape(userName),
    csvEscape(userEmail),
    s.jobDescriptionId ?? "",
    s.resumeId ?? "",
    s.sessionType,
    s.status,
    s.startedAt ? new Date(s.startedAt).toISOString() : "",
    s.endedAt ? new Date(s.endedAt).toISOString() : "",
    s.overallScore ?? "",
    csvEscape(s.notes?.slice(0, 500)),
    csvEscape(s.organizationId),
    s.createdAt ? new Date(s.createdAt).toISOString() : "",
    s.updatedAt ? new Date(s.updatedAt).toISOString() : "",
    s.deletedAt ? new Date(s.deletedAt).toISOString() : "",
  ]);

  return [headers.join(","), ...dataRows.map((r) => r.join(","))].join("\n");
}

export interface JobMarketplaceEngagementExportOptions {
  from?: string; // ISO date (job createdAt)
  to?: string;   // ISO date (job createdAt)
  status?: "draft" | "published" | "closed"; // filter by job status
}

/** Generate job marketplace engagement metrics CSV (deeppivot-314). Per-job rows with application/match/invitation counts. */
export async function generateJobMarketplaceEngagementCsv(
  options: JobMarketplaceEngagementExportOptions = {}
): Promise<string> {
  const { from, to, status: statusFilter } = options;

  const conditions = [];
  if (from) conditions.push(gte(jobsTable.createdAt, new Date(from)));
  if (to) conditions.push(lte(jobsTable.createdAt, new Date(to)));
  if (statusFilter) conditions.push(eq(jobsTable.status, statusFilter));

  const [jobsWithCompany, appCounts, matchCounts, inviteCounts] = await Promise.all([
    db
      .select({
        job: jobsTable,
        companyName: companiesTable.name,
      })
      .from(jobsTable)
      .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : sql`true`)
      .orderBy(desc(jobsTable.createdAt)),
    db
      .select({
        jobId: jobMarketplaceApplicationsTable.jobId,
        status: jobMarketplaceApplicationsTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobMarketplaceApplicationsTable)
      .groupBy(jobMarketplaceApplicationsTable.jobId, jobMarketplaceApplicationsTable.status),
    db
      .select({
        jobId: jobMatchesTable.jobId,
        status: jobMatchesTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobMatchesTable)
      .groupBy(jobMatchesTable.jobId, jobMatchesTable.status),
    db
      .select({
        jobId: employerJobInvitationsTable.jobId,
        count: sql<number>`count(*)::int`,
      })
      .from(employerJobInvitationsTable)
      .groupBy(employerJobInvitationsTable.jobId),
  ]);

  const appMap = new Map<number, Record<string, number>>();
  for (const { jobId, status, count } of appCounts) {
    const m = appMap.get(jobId) ?? { new: 0, reviewing: 0, rejected: 0, hired: 0 };
    m[status as keyof typeof m] = count;
    appMap.set(jobId, m);
  }

  const matchMap = new Map<number, Record<string, number>>();
  for (const { jobId, status, count } of matchCounts) {
    const m = matchMap.get(jobId) ?? { suggested: 0, viewed: 0, invited: 0, applied: 0, dismissed: 0 };
    m[status as keyof typeof m] = count;
    matchMap.set(jobId, m);
  }

  const inviteMap = new Map<number, number>();
  for (const { jobId, count } of inviteCounts) inviteMap.set(jobId, count);

  const headers = [
    "Job ID", "Company", "Title", "Status", "Location", "Job Type", "Experience Level",
    "Salary Min", "Salary Max", "Remote", "Created At", "Updated At",
    "Applications Total", "Applications New", "Applications Reviewing", "Applications Rejected", "Applications Hired",
    "Matches Total", "Matches Suggested", "Matches Viewed", "Matches Invited", "Matches Applied", "Matches Dismissed",
    "Invitations Sent",
  ];

  const sumValues = (obj: Record<string, number>) => Object.values(obj).reduce((a, b) => a + b, 0);

  const dataRows = jobsWithCompany.map(({ job: j, companyName }) => {
    const apps = appMap.get(j.id) ?? {};
    const appTotal = sumValues(apps);
    const matches = matchMap.get(j.id) ?? {};
    const matchTotal = sumValues(matches);
    const invites = inviteMap.get(j.id) ?? 0;

    return [
      j.id,
      csvEscape(companyName),
      csvEscape(j.title),
      j.status,
      csvEscape(j.location),
      j.jobType,
      j.experienceLevel,
      j.salaryMin ?? "",
      j.salaryMax ?? "",
      j.remoteFlag ? "Yes" : "No",
      j.createdAt ? new Date(j.createdAt).toISOString() : "",
      j.updatedAt ? new Date(j.updatedAt).toISOString() : "",
      appTotal,
      apps.new ?? 0,
      apps.reviewing ?? 0,
      apps.rejected ?? 0,
      apps.hired ?? 0,
      matchTotal,
      matches.suggested ?? 0,
      matches.viewed ?? 0,
      matches.invited ?? 0,
      matches.applied ?? 0,
      matches.dismissed ?? 0,
      invites,
    ];
  });

  return [headers.join(","), ...dataRows.map((r) => r.join(","))].join("\n");
}
