import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/src/db";
import {
  companiesTable,
  jobMatchesTable,
  jobMarketplaceApplicationsTable,
  jobsTable,
  usersTable,
} from "@/src/db/schema";
import { rateLimit } from "@/src/lib/rate-limit";

/**
 * GET /api/jobs/matches
 *
 * Candidate-side job recommendations from precomputed `job_matches`.
 * Query params:
 * - page (default 1)
 * - limit (default 20, max 50)
 * - minScore (default 0)
 * - includeApplied ("true" to include jobs already applied to; default false)
 */
export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, "DEFAULT");
  if (!rl.success) return rl.response;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const minScore = Math.max(0, Math.min(100, Number.parseInt(url.searchParams.get("minScore") ?? "0", 10)));
    const includeApplied = url.searchParams.get("includeApplied") === "true";
    const offset = (page - 1) * limit;

    // For candidates/learners, only suggested/viewed/invited are returned by default.
    const baseConditions = [
      eq(jobMatchesTable.userId, dbUser.id),
      eq(jobsTable.status, "published"),
      ne(jobMatchesTable.status, "dismissed"),
      ne(jobMatchesTable.status, "applied"),
    ];

    const rows = await db
      .select({
        matchId: jobMatchesTable.id,
        jobId: jobMatchesTable.jobId,
        matchScore: jobMatchesTable.matchScore,
        matchStatus: jobMatchesTable.status,
        matchedAt: jobMatchesTable.updatedAt,

        title: jobsTable.title,
        description: jobsTable.description,
        location: jobsTable.location,
        jobType: jobsTable.jobType,
        experienceLevel: jobsTable.experienceLevel,
        salaryMin: jobsTable.salaryMin,
        salaryMax: jobsTable.salaryMax,
        remoteFlag: jobsTable.remoteFlag,
        companyName: companiesTable.name,
        companyLogoUrl: companiesTable.logoUrl,

        applicationId: jobMarketplaceApplicationsTable.id,
        applicationStatus: jobMarketplaceApplicationsTable.status,
      })
      .from(jobMatchesTable)
      .innerJoin(jobsTable, eq(jobMatchesTable.jobId, jobsTable.id))
      .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
      .leftJoin(
        jobMarketplaceApplicationsTable,
        and(
          eq(jobMarketplaceApplicationsTable.jobId, jobsTable.id),
          eq(jobMarketplaceApplicationsTable.userId, dbUser.id)
        )
      )
      .where(and(...baseConditions))
      .orderBy(desc(jobMatchesTable.matchScore), desc(jobMatchesTable.updatedAt))
      .limit(limit * 3)
      .offset(offset);

    const filtered = rows
      .filter((row) => row.matchScore >= minScore)
      .filter((row) => (includeApplied ? true : row.applicationId == null))
      .slice(0, limit);

    // Mark newly surfaced suggestions as viewed.
    const toMarkViewed = filtered
      .filter((row) => row.matchStatus === "suggested")
      .map((row) => row.matchId);

    if (toMarkViewed.length > 0) {
      await db
        .update(jobMatchesTable)
        .set({ status: "viewed", updatedAt: new Date() })
        .where(inArray(jobMatchesTable.id, toMarkViewed));
    }

    return NextResponse.json({
      page,
      limit,
      matches: filtered.map((row) => ({
        matchId: row.matchId,
        jobId: row.jobId,
        matchScore: row.matchScore,
        matchStatus: row.matchStatus === "suggested" ? "viewed" : row.matchStatus,
        matchedAt: row.matchedAt,
        title: row.title,
        description: row.description,
        location: row.location,
        jobType: row.jobType,
        experienceLevel: row.experienceLevel,
        salaryMin: row.salaryMin,
        salaryMax: row.salaryMax,
        remoteFlag: row.remoteFlag,
        companyName: row.companyName,
        companyLogoUrl: row.companyLogoUrl,
        alreadyApplied: row.applicationId != null,
        applicationStatus: row.applicationStatus,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch matched jobs" }, { status: 500 });
  }
}

