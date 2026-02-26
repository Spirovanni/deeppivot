import { db } from "@/src/db";
import { companiesTable, jobsTable } from "@/src/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { Suspense } from "react";
import Link from "next/link";
import { JobSearchFilters } from "@/components/jobs/JobSearchFilters";

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
        })
        .from(jobsTable)
        .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
        .where(and(...conditions))
        .orderBy(jobsTable.createdAt)
        .limit(30);

    if (jobs.length === 0) {
        return (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-white font-semibold mb-1">No jobs found</p>
                <p className="text-white/50 text-sm">Try adjusting your filters or check back later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {jobs.map((job) => (
                <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-start gap-4 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 hover:border-white/20 p-5 transition-all group"
                >
                    {/* Company logo placeholder */}
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-lg shrink-0">
                        {job.companyLogoUrl ? (
                            <img src={job.companyLogoUrl} alt={job.companyName} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                            job.companyName.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold group-hover:text-indigo-300 transition-colors">
                            {job.title}
                        </h3>
                        <p className="text-white/50 text-sm mt-0.5">
                            {job.companyName}
                            {job.companyIndustry ? ` · ${job.companyIndustry}` : ""}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded-md text-xs">
                                {TYPE_LABELS[job.jobType] ?? job.jobType}
                            </span>
                            <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded-md text-xs">
                                {LEVEL_LABELS[job.experienceLevel] ?? job.experienceLevel}
                            </span>
                            {job.remoteFlag && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md text-xs">
                                    Remote
                                </span>
                            )}
                            {job.location && (
                                <span className="text-white/40 text-xs">📍 {job.location}</span>
                            )}
                            {formatSalary(job.salaryMin, job.salaryMax) && (
                                <span className="text-white/40 text-xs ml-auto">
                                    {formatSalary(job.salaryMin, job.salaryMax)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-white/30 text-xs shrink-0 mt-0.5">
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
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Job Marketplace</h1>
                    <p className="text-white/50 mt-1">Discover opportunities from top employers</p>
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
                                        <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-5 h-24 animate-pulse" />
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
