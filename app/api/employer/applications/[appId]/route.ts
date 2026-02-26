import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
    companiesTable,
    jobApplicationsTable,
    jobMarketplaceApplicationsTable,
    jobsTable,
    usersTable,
} from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * PATCH /api/employer/applications/[appId]
 * Employer updates the status of a marketplace application.
 * Propagates status change to the linked job_applications tracker card.
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ appId: string }> }
) {
    try {
        const { appId } = await params;
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

        const body = await req.json();
        const { status } = body;
        const validStatuses = ["new", "reviewing", "rejected", "hired"];
        if (!status || !validStatuses.includes(status))
            return NextResponse.json({ error: `status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });

        // Verify the application belongs to a job owned by this employer
        const [app] = await db
            .select({ id: jobMarketplaceApplicationsTable.id })
            .from(jobMarketplaceApplicationsTable)
            .innerJoin(jobsTable, eq(jobMarketplaceApplicationsTable.jobId, jobsTable.id))
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(
                dbUser.role === "admin"
                    ? eq(jobMarketplaceApplicationsTable.id, parseInt(appId))
                    : and(
                        eq(jobMarketplaceApplicationsTable.id, parseInt(appId)),
                        eq(companiesTable.ownerUserId, dbUser.id)
                    )
            )
            .limit(1);

        if (!app)
            return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });

        // Update marketplace application status
        const [updated] = await db
            .update(jobMarketplaceApplicationsTable)
            .set({ status, updatedAt: new Date() })
            .where(eq(jobMarketplaceApplicationsTable.id, parseInt(appId)))
            .returning();

        // Propagate status to linked tracker card
        const statusMap: Record<string, string> = {
            new: "applied",
            reviewing: "interview",
            rejected: "rejected",
            hired: "offer",
        };
        await db
            .update(jobApplicationsTable)
            .set({ status: statusMap[status], updatedAt: new Date() })
            .where(eq(jobApplicationsTable.marketplaceApplicationId, parseInt(appId)));

        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }
}
