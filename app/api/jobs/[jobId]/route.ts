import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { companiesTable, jobsTable, usersTable } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

/** GET /api/jobs/[jobId] — full job detail with company */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;
        const [job] = await db
            .select({
                id: jobsTable.id,
                title: jobsTable.title,
                description: jobsTable.description,
                location: jobsTable.location,
                jobType: jobsTable.jobType,
                experienceLevel: jobsTable.experienceLevel,
                salaryMin: jobsTable.salaryMin,
                salaryMax: jobsTable.salaryMax,
                remoteFlag: jobsTable.remoteFlag,
                status: jobsTable.status,
                createdAt: jobsTable.createdAt,
                updatedAt: jobsTable.updatedAt,
                companyId: jobsTable.companyId,
                companyName: companiesTable.name,
                companyLogoUrl: companiesTable.logoUrl,
                companyWebsite: companiesTable.website,
                companyDescription: companiesTable.description,
                companyLocation: companiesTable.location,
                companyIndustry: companiesTable.industry,
                companySize: companiesTable.size,
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(eq(jobsTable.id, parseInt(jobId)))
            .limit(1);

        if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(job);
    } catch {
        return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
    }
}

/** PATCH /api/jobs/[jobId] — employer-only update (with ownership check) */
export async function PATCH(
    req: Request,
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

        const body = await req.json();

        // Verify job ownership through company
        const [job] = await db
            .select({ id: jobsTable.id, companyId: jobsTable.companyId })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(
                dbUser.role === "admin"
                    ? eq(jobsTable.id, parseInt(jobId))
                    : and(
                        eq(jobsTable.id, parseInt(jobId)),
                        eq(companiesTable.ownerUserId, dbUser.id)
                    )
            )
            .limit(1);

        if (!job) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

        const [updated] = await db
            .update(jobsTable)
            .set({
                ...(body.title !== undefined && { title: body.title.trim() }),
                ...(body.description !== undefined && { description: body.description.trim() }),
                ...(body.location !== undefined && { location: body.location }),
                ...(body.jobType !== undefined && { jobType: body.jobType }),
                ...(body.experienceLevel !== undefined && { experienceLevel: body.experienceLevel }),
                ...(body.salaryMin !== undefined && { salaryMin: body.salaryMin }),
                ...(body.salaryMax !== undefined && { salaryMax: body.salaryMax }),
                ...(body.remoteFlag !== undefined && { remoteFlag: body.remoteFlag }),
                ...(body.status !== undefined && { status: body.status }),
                updatedAt: new Date(),
            })
            .where(eq(jobsTable.id, parseInt(jobId)))
            .returning();

        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
    }
}

/** DELETE /api/jobs/[jobId] — closes a job (sets status to 'closed') */
export async function DELETE(
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

        const [job] = await db
            .select({ id: jobsTable.id })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(
                dbUser.role === "admin"
                    ? eq(jobsTable.id, parseInt(jobId))
                    : and(
                        eq(jobsTable.id, parseInt(jobId)),
                        eq(companiesTable.ownerUserId, dbUser.id)
                    )
            )
            .limit(1);

        if (!job) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });

        await db
            .update(jobsTable)
            .set({ status: "closed", updatedAt: new Date() })
            .where(eq(jobsTable.id, parseInt(jobId)));

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to close job" }, { status: 500 });
    }
}
