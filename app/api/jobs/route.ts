import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { companiesTable, jobsTable, usersTable } from "@/src/db/schema";
import { and, eq, gte, ilike, lte, or } from "drizzle-orm";
import { embedText } from "@/src/lib/embeddings";
import { buildMarketplaceJobEmbeddingText } from "@/src/lib/job-embeddings";

/** GET /api/jobs — paginated, filterable list (only published visible to non-owners) */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") ?? "";
        const location = searchParams.get("location") ?? "";
        const jobType = searchParams.get("jobType") ?? "";
        const experienceLevel = searchParams.get("experienceLevel") ?? "";
        const remoteFlag = searchParams.get("remoteFlag");
        const salaryMin = searchParams.get("salaryMin");
        const salaryMax = searchParams.get("salaryMax");
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
        const offset = (page - 1) * limit;

        const conditions = [eq(jobsTable.status, "published")];

        if (q) {
            conditions.push(
                or(
                    ilike(jobsTable.title, `%${q}%`),
                    ilike(jobsTable.description, `%${q}%`)
                )!
            );
        }
        if (location) conditions.push(ilike(jobsTable.location!, `%${location}%`));
        if (jobType) conditions.push(eq(jobsTable.jobType, jobType));
        if (experienceLevel) conditions.push(eq(jobsTable.experienceLevel, experienceLevel));
        if (remoteFlag === "true") conditions.push(eq(jobsTable.remoteFlag, true));
        if (salaryMin) conditions.push(gte(jobsTable.salaryMin!, parseInt(salaryMin)));
        if (salaryMax) conditions.push(lte(jobsTable.salaryMax!, parseInt(salaryMax)));

        const jobs = await db
            .select({
                id: jobsTable.id,
                title: jobsTable.title,
                location: jobsTable.location,
                jobType: jobsTable.jobType,
                experienceLevel: jobsTable.experienceLevel,
                salaryMin: jobsTable.salaryMin,
                salaryMax: jobsTable.salaryMax,
                remoteFlag: jobsTable.remoteFlag,
                status: jobsTable.status,
                createdAt: jobsTable.createdAt,
                companyId: jobsTable.companyId,
                companyName: companiesTable.name,
                companyLogoUrl: companiesTable.logoUrl,
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(and(...conditions))
            .orderBy(jobsTable.createdAt)
            .limit(limit)
            .offset(offset);

        return NextResponse.json({ jobs, page, limit });
    } catch {
        return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
    }
}

/** POST /api/jobs — create a job (employer only) */
export async function POST(req: Request) {
    try {
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
        const {
            companyId, title, description, location, jobType,
            experienceLevel, salaryMin, salaryMax, remoteFlag, status,
        } = body;

        if (!companyId || !title?.trim() || !description?.trim())
            return NextResponse.json({ error: "companyId, title, and description are required" }, { status: 400 });

        // Verify ownership
        const [company] = await db
            .select({ id: companiesTable.id, ownerUserId: companiesTable.ownerUserId, name: companiesTable.name })
            .from(companiesTable)
            .where(
                dbUser.role === "admin"
                    ? eq(companiesTable.id, companyId)
                    : and(eq(companiesTable.id, companyId), eq(companiesTable.ownerUserId, dbUser.id))
            )
            .limit(1);

        if (!company)
            return NextResponse.json({ error: "Company not found or access denied" }, { status: 403 });

        const titleClean = title.trim();
        const descriptionClean = description.trim();

        let embeddingVector: number[] | null = null;
        try {
            const embeddingText = buildMarketplaceJobEmbeddingText({
                title: titleClean,
                description: descriptionClean,
                companyName: company.name,
                location: location ?? null,
                jobType: jobType ?? "full_time",
                experienceLevel: experienceLevel ?? "mid",
                salaryMin: salaryMin ?? null,
                salaryMax: salaryMax ?? null,
                remoteFlag: remoteFlag ?? false,
            });
            const { embedding } = await embedText(embeddingText);
            embeddingVector = embedding;
        } catch (err) {
            console.warn("[jobs] Failed to generate marketplace job embedding:", err);
        }

        const [job] = await db
            .insert(jobsTable)
            .values({
                companyId,
                title: titleClean,
                description: descriptionClean,
                embeddingVector,
                location: location ?? null,
                jobType: jobType ?? "full_time",
                experienceLevel: experienceLevel ?? "mid",
                salaryMin: salaryMin ?? null,
                salaryMax: salaryMax ?? null,
                remoteFlag: remoteFlag ?? false,
                status: status ?? "draft",
            })
            .returning();

        return NextResponse.json(job, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }
}
