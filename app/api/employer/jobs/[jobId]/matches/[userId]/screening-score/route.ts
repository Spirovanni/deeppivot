/**
 * GET /api/employer/jobs/[jobId]/matches/[userId]/screening-score
 * Employer-only. Returns LLM-based resume screening score for a matched candidate (deeppivot-317).
 */
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { companiesTable, jobsTable, usersTable } from "@/src/db/schema";
import { generateResumeScreeningScore } from "@/src/lib/resume-screening-score";
import { rateLimit } from "@/src/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string; userId: string }> }
) {
  const rl = await rateLimit(req, "DEFAULT");
  if (!rl.success) return rl.response;

  try {
    const { jobId, userId } = await params;
    const jobIdNum = parseInt(jobId, 10);
    const userIdNum = parseInt(userId, 10);
    if (!Number.isInteger(jobIdNum) || jobIdNum <= 0 || !Number.isInteger(userIdNum) || userIdNum <= 0) {
      return NextResponse.json({ error: "Invalid job or user ID" }, { status: 400 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [dbUser] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUser.id))
      .limit(1);

    if (!dbUser || (dbUser.role !== "employer" && dbUser.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [job] = await db
      .select({ id: jobsTable.id })
      .from(jobsTable)
      .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
      .where(
        dbUser.role === "admin"
          ? eq(jobsTable.id, jobIdNum)
          : and(eq(jobsTable.id, jobIdNum), eq(companiesTable.ownerUserId, dbUser.id))
      )
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 });
    }

    const result = await generateResumeScreeningScore(jobIdNum, userIdNum);
    if (!result) {
      return NextResponse.json({ error: "Could not generate screening score (no resume or LLM unavailable)" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to get screening score" }, { status: 500 });
  }
}
