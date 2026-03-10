import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
  companiesTable,
  jobMarketplaceApplicationsTable,
  jobsTable,
  usersTable,
} from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Briefcase, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: {
    label: "Applied",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  reviewing: {
    label: "In Review",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  rejected: {
    label: "Not Selected",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  hired: {
    label: "Hired",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
};

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function MyApplicationsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/onboarding");

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
      companyName: companiesTable.name,
      companyLogoUrl: companiesTable.logoUrl,
    })
    .from(jobMarketplaceApplicationsTable)
    .innerJoin(jobsTable, eq(jobMarketplaceApplicationsTable.jobId, jobsTable.id))
    .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
    .where(eq(jobMarketplaceApplicationsTable.userId, dbUser.id))
    .orderBy(desc(jobMarketplaceApplicationsTable.createdAt));

  const counts = {
    total: applications.length,
    active: applications.filter((a) => a.status === "new" || a.status === "reviewing").length,
    hired: applications.filter((a) => a.status === "hired").length,
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">
            My Applications
          </h1>
          <p className="text-muted-foreground mt-1">
            Track the status of your job marketplace applications
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{counts.total}</p>
            <p className="text-xs text-muted-foreground">Total Applied</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{counts.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.hired}</p>
            <p className="text-xs text-muted-foreground">Hired</p>
          </div>
        </div>

        {/* Applications list */}
        {applications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/50 p-12 text-center">
            <Briefcase className="mx-auto mb-3 size-10 text-muted-foreground/50" />
            <p className="text-foreground font-semibold mb-1">No applications yet</p>
            <p className="text-muted-foreground text-sm mb-4">
              Browse the marketplace and apply to jobs that match your skills.
            </p>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const statusConfig = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.new;
              const isJobClosed = app.jobStatus === "closed";

              return (
                <div
                  key={app.id}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/30"
                >
                  {/* Company logo */}
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    {app.companyLogoUrl ? (
                      <img
                        src={app.companyLogoUrl}
                        alt={app.companyName}
                        className="size-12 rounded-xl object-cover"
                      />
                    ) : (
                      app.companyName.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{app.jobTitle}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{app.companyName}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md bg-muted px-2 py-0.5">
                        {TYPE_LABELS[app.jobType] ?? app.jobType}
                      </span>
                      {app.jobLocation && <span>📍 {app.jobLocation}</span>}
                      <span className="text-muted-foreground/50">·</span>
                      <span>Applied {formatDate(app.createdAt)}</span>
                      {isJobClosed && (
                        <>
                          <span className="text-muted-foreground/50">·</span>
                          <span className="text-red-500/70">Position closed</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-3">
                      {!isJobClosed && (
                        <Link
                          href={`/jobs/${app.jobId}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          View Job <ExternalLink className="size-3" />
                        </Link>
                      )}
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Resume <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
