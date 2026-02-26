import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { companiesTable, jobMarketplaceApplicationsTable, jobsTable, usersTable } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

/** GET /api/employer/jobs/[jobId]/applications — employer fetches applicants */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;
        const clerkUser = await currentUser();
        if (!clerkUser?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [dbUser] = await db
            .select({ id: usersTable.id, role: usersTable.role })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkUser.id))
            .limit(1);

        if (!dbUser || (dbUser.role !== "employer" && dbUser.role !== "admin"))
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Verify job belongs to this employer
        const [job] = await db
            .select({ id: jobsTable.id })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(
                dbUser.role === "admin"
                    ? eq(jobsTable.id, parseInt(jobId))
                    : and(eq(jobsTable.id, parseInt(jobId)), eq(companiesTable.ownerUserId, dbUser.id))
            )
            .limit(1);

        if (!job) return NextResponse.json({ error: "Job not found or access denied" }, { status: 404 });

        const applications = await db
            .select({
                id: jobMarketplaceApplicationsTable.id,
                status: jobMarketplaceApplicationsTable.status,
                resumeUrl: jobMarketplaceApplicationsTable.resumeUrl,
                coverLetter: jobMarketplaceApplicationsTable.coverLetter,
                createdAt: jobMarketplaceApplicationsTable.createdAt,
                userId: jobMarketplaceApplicationsTable.userId,
                applicantName: usersTable.name,
                applicantEmail: usersTable.email,
                applicantAvatarUrl: usersTable.avatarUrl,
            })
            .from(jobMarketplaceApplicationsTable)
            .innerJoin(usersTable, eq(jobMarketplaceApplicationsTable.userId, usersTable.id))
            .where(eq(jobMarketplaceApplicationsTable.jobId, parseInt(jobId)))
            .orderBy(jobMarketplaceApplicationsTable.createdAt);

        return NextResponse.json(applications);
    } catch {
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }
}
