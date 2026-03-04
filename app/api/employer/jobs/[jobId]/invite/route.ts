import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
    companiesTable,
    employerJobInvitationsTable,
    jobMatchesTable,
    jobMarketplaceApplicationsTable,
    jobsTable,
    usersTable,
} from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import { sendEmployerInviteEmail } from "@/src/lib/email";

/**
 * POST /api/employer/jobs/[jobId]/invite
 *
 * Employer invites a candidate to apply for a job.
 * Sends "Employer invited you to apply" email to the candidate.
 * Returns 409 if candidate already applied or was already invited.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const rl = await rateLimit(req, "DEFAULT");
    if (!rl.success) return rl.response;

    try {
        const { jobId } = await params;
        const clerkUser = await currentUser();
        if (!clerkUser?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [employer] = await db
            .select({ id: usersTable.id, name: usersTable.name, role: usersTable.role })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkUser.id))
            .limit(1);

        if (!employer)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (employer.role !== "employer" && employer.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json().catch(() => ({}));
        const candidateUserId = typeof body.candidateUserId === "number"
            ? body.candidateUserId
            : parseInt(String(body.candidateUserId), 10);

        if (!Number.isInteger(candidateUserId) || candidateUserId <= 0)
            return NextResponse.json(
                { error: "Valid candidateUserId is required" },
                { status: 400 }
            );

        const jobIdNum = parseInt(jobId, 10);
        if (!Number.isInteger(jobIdNum))
            return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

        // Verify job belongs to employer
        const [job] = await db
            .select({
                id: jobsTable.id,
                title: jobsTable.title,
                status: jobsTable.status,
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(
                employer.role === "admin"
                    ? eq(jobsTable.id, jobIdNum)
                    : and(
                        eq(jobsTable.id, jobIdNum),
                        eq(companiesTable.ownerUserId, employer.id)
                    )
            )
            .limit(1);

        if (!job) return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 });
        if (job.status === "closed")
            return NextResponse.json({ error: "Job is closed" }, { status: 410 });

        // Can't invite self
        if (candidateUserId === employer.id)
            return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });

        // Check if candidate already applied
        const [existingApp] = await db
            .select({ id: jobMarketplaceApplicationsTable.id })
            .from(jobMarketplaceApplicationsTable)
            .where(
                and(
                    eq(jobMarketplaceApplicationsTable.jobId, jobIdNum),
                    eq(jobMarketplaceApplicationsTable.userId, candidateUserId)
                )
            )
            .limit(1);

        if (existingApp)
            return NextResponse.json(
                { error: "Candidate has already applied" },
                { status: 409 }
            );

        // Insert invitation (unique on jobId + candidateUserId)
        try {
            await db.insert(employerJobInvitationsTable).values({
                jobId: jobIdNum,
                candidateUserId,
                invitedByUserId: employer.id,
            });
        } catch (err) {
            // Unique constraint = already invited
            if (err && typeof err === "object" && "code" in err && err.code === "23505")
                return NextResponse.json(
                    { error: "Candidate was already invited" },
                    { status: 409 }
                );
            throw err;
        }

        // Get candidate email and company name
        const [candidate] = await db
            .select({ name: usersTable.name, email: usersTable.email })
            .from(usersTable)
            .where(eq(usersTable.id, candidateUserId))
            .limit(1);

        const [companyRow] = await db
            .select({ name: companiesTable.name })
            .from(companiesTable)
            .innerJoin(jobsTable, eq(jobsTable.companyId, companiesTable.id))
            .where(eq(jobsTable.id, jobIdNum))
            .limit(1);

        const companyName = companyRow?.name ?? "the company";

        if (candidate?.email) {
            await sendEmployerInviteEmail(candidate.email, {
                candidateName: candidate.name || undefined,
                employerName: employer.name ?? "An employer",
                companyName,
                jobTitle: job.title,
                jobId: jobIdNum,
            });
        }

        // Reflect invite state in candidate-job match lifecycle when present.
        await db
            .update(jobMatchesTable)
            .set({ status: "invited", updatedAt: new Date() })
            .where(
                and(
                    eq(jobMatchesTable.jobId, jobIdNum),
                    eq(jobMatchesTable.userId, candidateUserId)
                )
            );

        return NextResponse.json({ success: true, invited: true });
    } catch {
        return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
    }
}
