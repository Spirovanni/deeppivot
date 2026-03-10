import { db } from "@/src/db";
import {
  companiesTable,
  jobBoardsTable,
  jobMarketplaceApplicationsTable,
  jobMatchesTable,
  jobsTable,
  usersTable,
} from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, Building2, ExternalLink, Globe, MapPin } from "lucide-react";
import { WhyYouMatchTooltip } from "@/components/jobs/WhyYouMatchTooltip";
import { JobDetailApply } from "@/components/jobs/JobDetailApply";

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

const LEVEL_LABELS: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior Level",
  executive: "Executive",
};

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (v: number) => `$${Math.round(v / 100).toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} / year`;
  if (min) return `From ${fmt(min)} / year`;
  return `Up to ${fmt(max!)} / year`;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const jobIdNum = parseInt(jobId, 10);
  if (isNaN(jobIdNum)) notFound();

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
      companyId: companiesTable.id,
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
    .where(eq(jobsTable.id, jobIdNum))
    .limit(1);

  if (!job) notFound();

  const { userId: clerkId } = await auth();
  let dbUserId: number | null = null;
  let matchScore: number | null = null;
  let hasApplied = false;
  let boardId: number | null = null;

  if (clerkId) {
    const [dbUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId))
      .limit(1);
    dbUserId = dbUser?.id ?? null;

    if (dbUserId) {
      // Check match score
      const [match] = await db
        .select({ matchScore: jobMatchesTable.matchScore })
        .from(jobMatchesTable)
        .where(and(eq(jobMatchesTable.jobId, jobIdNum), eq(jobMatchesTable.userId, dbUserId)))
        .limit(1);
      matchScore = match?.matchScore ?? null;

      // Check if already applied
      const [app] = await db
        .select({ id: jobMarketplaceApplicationsTable.id })
        .from(jobMarketplaceApplicationsTable)
        .where(
          and(
            eq(jobMarketplaceApplicationsTable.jobId, jobIdNum),
            eq(jobMarketplaceApplicationsTable.userId, dbUserId)
          )
        )
        .limit(1);
      hasApplied = !!app;

      // Get user's default board for apply modal
      const [board] = await db
        .select({ id: jobBoardsTable.id })
        .from(jobBoardsTable)
        .where(eq(jobBoardsTable.userId, dbUserId))
        .limit(1);
      boardId = board?.id ?? null;
    }
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const isClosed = job.status === "closed";

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to Job Marketplace
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                  {job.companyLogoUrl ? (
                    <img
                      src={job.companyLogoUrl}
                      alt={job.companyName}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    job.companyName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-xl font-bold text-foreground md:text-2xl">
                        {job.title}
                      </h1>
                      <p className="text-muted-foreground mt-0.5">{job.companyName}</p>
                    </div>
                    {typeof matchScore === "number" && (
                      <div className="shrink-0 text-right">
                        <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                          {matchScore}% match
                        </span>
                        <div className="mt-1">
                          <WhyYouMatchTooltip jobId={job.id} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meta badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-medium">
                      <Briefcase className="size-3" />
                      {TYPE_LABELS[job.jobType] ?? job.jobType}
                    </span>
                    <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-lg text-xs font-medium">
                      {LEVEL_LABELS[job.experienceLevel] ?? job.experienceLevel}
                    </span>
                    {job.remoteFlag && (
                      <span className="px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-lg text-xs font-medium">
                        Remote
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPin className="size-3" />
                        {job.location}
                      </span>
                    )}
                    {isClosed && (
                      <span className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-xs font-medium">
                        Position Closed
                      </span>
                    )}
                  </div>

                  {salary && (
                    <p className="text-sm font-medium text-foreground mt-3">{salary}</p>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Posted {new Date(job.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Apply section */}
              <div className="mt-5 pt-5 border-t border-border">
                {!clerkId ? (
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Sign in to apply
                  </Link>
                ) : isClosed ? (
                  <p className="text-sm text-muted-foreground">
                    This position is no longer accepting applications.
                  </p>
                ) : hasApplied ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm font-medium text-green-600 dark:text-green-400">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Application submitted
                    </span>
                    <Link
                      href="/dashboard/applications"
                      className="text-sm text-primary hover:underline"
                    >
                      View my applications
                    </Link>
                  </div>
                ) : boardId ? (
                  <JobDetailApply
                    jobId={job.id}
                    jobTitle={job.title}
                    companyName={job.companyName}
                    boardId={boardId}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Set up your{" "}
                    <Link href="/dashboard/job-tracker" className="text-primary hover:underline">
                      Job Tracker
                    </Link>{" "}
                    to apply for jobs.
                  </p>
                )}
              </div>
            </div>

            {/* Job description */}
            <div className="rounded-xl border border-border bg-card p-6 mt-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">Job Description</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </div>
            </div>
          </div>

          {/* Company sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="rounded-xl border border-border bg-card p-5 sticky top-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {job.companyLogoUrl ? (
                    <img
                      src={job.companyLogoUrl}
                      alt={job.companyName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    job.companyName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{job.companyName}</h3>
                  {job.companyIndustry && (
                    <p className="text-xs text-muted-foreground">{job.companyIndustry}</p>
                  )}
                </div>
              </div>

              {job.companyDescription && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                  {job.companyDescription}
                </p>
              )}

              <div className="space-y-2.5 text-sm">
                {job.companyLocation && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4 shrink-0" />
                    <span>{job.companyLocation}</span>
                  </div>
                )}
                {job.companySize && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-4 shrink-0" />
                    <span>{job.companySize} employees</span>
                  </div>
                )}
                {job.companyWebsite && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="size-4 shrink-0" />
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Website
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
