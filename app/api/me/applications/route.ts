import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { companiesTable, jobMarketplaceApplicationsTable, jobsTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

/** GET /api/me/applications — authenticated learner's marketplace applications */
export async function GET() {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [dbUser] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkUser.id))
            .limit(1);
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const applications = await db
            .select({
                id: jobMarketplaceApplicationsTable.id,
                status: jobMarketplaceApplicationsTable.status,
                resumeUrl: jobMarketplaceApplicationsTable.resumeUrl,
                coverLetter: jobMarketplaceApplicationsTable.coverLetter,
                createdAt: jobMarketplaceApplicationsTable.createdAt,
                updatedAt: jobMarketplaceApplicationsTable.updatedAt,
                jobId: jobsTable.id,
                jobTitle: jobsTable.title,
                jobLocation: jobsTable.location,
                jobType: jobsTable.jobType,
                jobStatus: jobsTable.status,
                companyId: companiesTable.id,
                companyName: companiesTable.name,
                companyLogoUrl: companiesTable.logoUrl,
            })
            .from(jobMarketplaceApplicationsTable)
            .innerJoin(jobsTable, eq(jobMarketplaceApplicationsTable.jobId, jobsTable.id))
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(eq(jobMarketplaceApplicationsTable.userId, dbUser.id))
            .orderBy(jobMarketplaceApplicationsTable.createdAt);

        return NextResponse.json(applications);
    } catch {
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }
}
