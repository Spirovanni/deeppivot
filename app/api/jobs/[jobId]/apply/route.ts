import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
    careerArchetypesTable,
    companiesTable,
    interviewSessionsTable,
    jobApplicationsTable,
    jobColumnsTable,
    jobMarketplaceApplicationsTable,
    jobsTable,
    usersTable,
} from "@/src/db/schema";
import { and, avg, eq } from "drizzle-orm";
import { captureServerEvent } from "@/src/lib/posthog-server";
import { rateLimit } from "@/src/lib/rate-limit";
import { sendNewApplicantEmail } from "@/src/lib/email";
import { addPointsForJobApplication } from "@/src/lib/gamification";

/**
 * POST /api/jobs/[jobId]/apply
 *
 * Creates a job_marketplace_applications row and a matching job_applications
 * tracker card (sourceType=marketplace). Enforces:
 *   - 410 if job is closed
 *   - 409 if user already applied
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const rl = await rateLimit(req, "INTERVIEW_START");
    if (!rl.success) return rl.response;

    try {
        const { jobId } = await params;
        const clerkUser = await currentUser();
        if (!clerkUser?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [dbUser] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkUser.id))
            .limit(1);
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Fetch job with company
        const [job] = await db
            .select({
                id: jobsTable.id,
                title: jobsTable.title,
                status: jobsTable.status,
                companyId: jobsTable.companyId,
                location: jobsTable.location,
            })
            .from(jobsTable)
            .where(eq(jobsTable.id, parseInt(jobId)))
            .limit(1);

        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (job.status === "closed")
            return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 410 });

        const body = await req.json();
        const { resumeUrl, coverLetter, boardId } = body;

        if (!boardId) return NextResponse.json({ error: "boardId is required" }, { status: 400 });

        // Check duplicate
        const [existing] = await db
            .select({ id: jobMarketplaceApplicationsTable.id })
            .from(jobMarketplaceApplicationsTable)
            .where(
                and(
                    eq(jobMarketplaceApplicationsTable.jobId, parseInt(jobId)),
                    eq(jobMarketplaceApplicationsTable.userId, dbUser.id)
                )
            )
            .limit(1);

        if (existing)
            return NextResponse.json({ error: "You have already applied for this job" }, { status: 409 });

        // Find the first column in the user's board to place the tracker card
        const [col] = await db
            .select({ id: jobColumnsTable.id })
            .from(jobColumnsTable)
            .where(eq(jobColumnsTable.boardId, boardId))
            .orderBy(jobColumnsTable.order)
            .limit(1);

        if (!col)
            return NextResponse.json({ error: "Job board has no columns" }, { status: 400 });

        // Create marketplace application + tracker card atomically (sequential inserts)
        const [marketplaceApp] = await db
            .insert(jobMarketplaceApplicationsTable)
            .values({
                jobId: parseInt(jobId),
                userId: dbUser.id,
                resumeUrl: resumeUrl ?? null,
                coverLetter: coverLetter ?? null,
                status: "new",
            })
            .returning();

        const [trackerCard] = await db
            .insert(jobApplicationsTable)
            .values({
                company: "", // will be populated via join on company name
                position: job.title,
                location: job.location ?? null,
                columnId: col.id,
                userId: dbUser.id,
                sourceType: "marketplace",
                marketplaceJobId: parseInt(jobId),
                marketplaceApplicationId: marketplaceApp.id,
                status: "applied",
            })
            .returning();

        // Analytics: track job application submission
        captureServerEvent({
            distinctId: clerkUser.id,
            event: "job_application_submitted",
            properties: { job_id: jobId, job_title: job.title, has_resume: !!resumeUrl, has_cover_letter: !!coverLetter },
        }).catch(() => { });

        // Gamification: award points for job application submitted
        const gamResult = await addPointsForJobApplication(dbUser.id).catch(() => null);

        // Notify employer by email (non-blocking)
        (async () => {
            try {
                // Look up employer via company owner
                const [company] = await db
                    .select({ ownerUserId: companiesTable.ownerUserId })
                    .from(companiesTable)
                    .where(eq(companiesTable.id, job.companyId))
                    .limit(1);
                if (!company) return;

                const [employer] = await db
                    .select({ email: usersTable.email, name: usersTable.firstName })
                    .from(usersTable)
                    .where(eq(usersTable.id, company.ownerUserId))
                    .limit(1);
                if (!employer?.email) return;

                // Applicant display name
                const [applicant] = await db
                    .select({ name: usersTable.name })
                    .from(usersTable)
                    .where(eq(usersTable.id, dbUser.id))
                    .limit(1);

                // Career archetype (optional)
                const [archetype] = await db
                    .select({ archetypeName: careerArchetypesTable.archetypeName })
                    .from(careerArchetypesTable)
                    .where(eq(careerArchetypesTable.userId, dbUser.id))
                    .limit(1);

                // Avg interview score (optional)
                const [scoreRow] = await db
                    .select({ avg: avg(interviewSessionsTable.overallScore) })
                    .from(interviewSessionsTable)
                    .where(eq(interviewSessionsTable.userId, dbUser.id));
                const avgScore = scoreRow?.avg ? Math.round(Number(scoreRow.avg)) : null;

                await sendNewApplicantEmail(employer.email, {
                    employerName: employer.name,
                    jobTitle: job.title,
                    applicantName: applicant?.name ?? "An applicant",
                    archetypeName: archetype?.archetypeName ?? null,
                    avgInterviewScore: avgScore,
                    jobId: job.id,
                });
            } catch (err) {
                console.error("[apply] Failed to send employer notification:", err);
            }
        })();

        return NextResponse.json(
            {
                application: marketplaceApp,
                trackerCard,
                ...(gamResult ? { pointsAwarded: gamResult.pointsAdded } : {}),
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }
}
