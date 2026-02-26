import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
    jobApplicationsTable,
    jobColumnsTable,
    jobMarketplaceApplicationsTable,
    jobsTable,
    usersTable,
} from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { captureServerEvent } from "@/src/lib/posthog-server";

/**
 * POST /api/jobs/[jobId]/apply
 *
 * Creates a job_marketplace_applications row and a matching job_applications
 * tracker card (sourceType=marketplace). Enforces:
 *   - 410 if job is closed
 *   - 409 if user already applied
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
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

        return NextResponse.json(
            { application: marketplaceApp, trackerCard },
            { status: 201 }
        );
    } catch {
        return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }
}
