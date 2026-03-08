import { db } from "@/src/db";
import { companiesTable, jobMatchesTable, jobsTable, usersTable } from "@/src/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { Suspense } from "react";
import Link from "next/link";
import { JobSearchFilters } from "@/components/jobs/JobSearchFilters";
import { auth } from "@clerk/nextjs/server";
import { WhyYouMatchTooltip } from "@/components/jobs/WhyYouMatchTooltip";

interface SearchProps {
    searchParams: Promise<{
        q?: string;
        location?: string;
        jobType?: string;
        experienceLevel?: string;
        remoteFlag?: string;
        salaryMin?: string;
        salaryMax?: string;
    }>;
}

const TYPE_LABELS: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
};

const LEVEL_LABELS: Record<string, string> = {
    entry: "Entry",
    mid: "Mid",
    senior: "Senior",
    executive: "Executive",
};

function formatSalary(min: number | null, max: number | null) {
    if (!min && !max) return null;
    const fmt = (v: number) => `$${Math.round(v / 100).toLocaleString()}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}/yr`;
    if (min) return `From ${fmt(min)}/yr`;
    return `Up to ${fmt(max!)}/yr`;
}

async function JobListings({ searchParams }: SearchProps) {
    const params = await searchParams;
    const { q, location, jobType, experienceLevel, remoteFlag, salaryMin, salaryMax } = params;
    const { userId: clerkId } = await auth();

    let dbUserId: number | null = null;
    if (clerkId) {
        const [dbUser] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkId))
            .limit(1);
        dbUserId = dbUser?.id ?? null;
    }

    const conditions = [eq(jobsTable.status, "published")];
    if (q) conditions.push(or(ilike(jobsTable.title, `%${q}%`), ilike(jobsTable.description, `%${q}%`))!);
    if (location) conditions.push(ilike(jobsTable.location!, `%${location}%`));
    if (jobType) conditions.push(eq(jobsTable.jobType, jobType));
    if (experienceLevel) conditions.push(eq(jobsTable.experienceLevel, experienceLevel));
    if (remoteFlag === "true") conditions.push(eq(jobsTable.remoteFlag, true));

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
            createdAt: jobsTable.createdAt,
            companyId: companiesTable.id,
            companyName: companiesTable.name,
            companyLogoUrl: companiesTable.logoUrl,
            companyIndustry: companiesTable.industry,
            matchScore: jobMatchesTable.matchScore,
        })
        .from(jobsTable)
        .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
        .leftJoin(
            jobMatchesTable,
            dbUserId
                ? and(eq(jobMatchesTable.jobId, jobsTable.id), eq(jobMatchesTable.userId, dbUserId))
                : eq(jobMatchesTable.id, -1)
        )
        .where(and(...conditions))
        .orderBy(jobsTable.createdAt)
        .limit(100);

    if (jobs.length === 0) {
        return (
            <div className="bg-muted/50 rounded-2xl border border-border p-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-foreground font-semibold mb-1">No jobs found</p>
                <p className="text-muted-foreground text-sm">Try adjusting your filters or check back later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {jobs.map((job) => (
                <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex items-start gap-4 bg-card hover:bg-accent/50 rounded-xl border border-border hover:border-primary/50 p-5 transition-all group"
                >
                    {/* Company logo placeholder */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {job.companyLogoUrl ? (
                            <img src={job.companyLogoUrl} alt={job.companyName} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                            job.companyName.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-foreground font-semibold group-hover:text-primary transition-colors">
                                {job.title}
                            </h3>
                            {typeof job.matchScore === "number" && (
                                <div className="shrink-0 text-right">
                                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                        {job.matchScore}% match
                                    </span>
                                    <div className="mt-1">
                                        <WhyYouMatchTooltip jobId={job.id} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {job.companyName}
                            {job.companyIndustry ? ` · ${job.companyIndustry}` : ""}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs">
                                {TYPE_LABELS[job.jobType] ?? job.jobType}
                            </span>
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs">
                                {LEVEL_LABELS[job.experienceLevel] ?? job.experienceLevel}
                            </span>
                            {job.remoteFlag && (
                                <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-md text-xs">
                                    Remote
                                </span>
                            )}
                            {job.location && (
                                <span className="text-muted-foreground/60 text-xs">📍 {job.location}</span>
                            )}
                            {formatSalary(job.salaryMin, job.salaryMax) && (
                                <span className="text-muted-foreground/60 text-xs ml-auto">
                                    {formatSalary(job.salaryMin, job.salaryMax)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-muted-foreground/40 text-xs shrink-0 mt-0.5">
                        {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                </Link>
            ))}
        </div>
    );
}

export default async function JobsPage({ searchParams }: SearchProps) {
    const params = await searchParams;
    const initialKeyword = params.q;

    return (
        <div className="p-6 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">Job Marketplace</h1>
                    <p className="text-muted-foreground mt-1">Discover opportunities from top employers</p>
                </div>

                <div className="flex gap-6">
                    {/* Filters sidebar */}
                    <div className="w-64 shrink-0">
                        <Suspense>
                            <JobSearchFilters initialKeyword={initialKeyword} />
                        </Suspense>
                    </div>

                    {/* Listings */}
                    <div className="flex-1 min-w-0">
                        <Suspense
                            fallback={
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="bg-card rounded-xl border border-border p-5 h-24 animate-pulse" />
                                    ))}
                                </div>
                            }
                        >
                            <JobListings searchParams={searchParams} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
