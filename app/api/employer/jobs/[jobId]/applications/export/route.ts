/**
 * GET /api/employer/jobs/[jobId]/applications/export — employer CSV export of applicants (deeppivot-316)
 */
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
    companiesTable,
    jobMarketplaceApplicationsTable,
    jobsTable,
    usersTable,
} from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

function csvEscape(val: string | null | undefined): string {
    const s = String(val ?? "");
    return `"${s.replace(/"/g, '""')}"`;
}

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

        const [job] = await db
            .select({ id: jobsTable.id, title: jobsTable.title })
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
                updatedAt: jobMarketplaceApplicationsTable.updatedAt,
                applicantName: usersTable.name,
                applicantEmail: usersTable.email,
            })
            .from(jobMarketplaceApplicationsTable)
            .innerJoin(usersTable, eq(jobMarketplaceApplicationsTable.userId, usersTable.id))
            .where(eq(jobMarketplaceApplicationsTable.jobId, parseInt(jobId)))
            .orderBy(jobMarketplaceApplicationsTable.createdAt);

        const headers = ["Application ID", "Applicant Name", "Applicant Email", "Status", "Resume URL", "Cover Letter", "Created At", "Updated At"];
        const dataRows = applications.map((a) => [
            a.id,
            csvEscape(a.applicantName),
            csvEscape(a.applicantEmail),
            a.status,
            csvEscape(a.resumeUrl),
            csvEscape(a.coverLetter?.slice(0, 2000)),
            a.createdAt ? new Date(a.createdAt).toISOString() : "",
            a.updatedAt ? new Date(a.updatedAt).toISOString() : "",
        ]);

        const csv = [headers.join(","), ...dataRows.map((r) => r.join(","))].join("\n");
        const safeTitle = (job.title ?? "job").replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 40);
        const filename = `applicants-${safeTitle}-${new Date().toISOString().split("T")[0]}.csv`;

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to export applications" }, { status: 500 });
    }
}
