/**
 * Inngest cron: Weekly digest email of top candidates for active employer jobs.
 *
 * Phase 16.5 (deeppivot-310)
 */

import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { inngest } from "@/src/inngest/client";
import { db } from "@/src/db";
import {
  careerArchetypesTable,
  companiesTable,
  interviewSessionsTable,
  jobMatchesTable,
  jobsTable,
  usersTable,
} from "@/src/db/schema";
import { sendWeeklyEmployerTopCandidatesDigestEmail } from "@/src/lib/email";

const MAX_JOBS_PER_EMPLOYER = 5;
const MAX_CANDIDATES_PER_JOB = 3;

type DigestCandidate = {
  userId: number;
  name: string;
  matchScore: number;
  archetypeName: string | null;
  avgInterviewScore: number | null;
};

export const weeklyEmployerTopCandidatesDigest = inngest.createFunction(
  {
    id: "weekly-employer-top-candidates-digest",
    name: "Weekly Employer Top Candidates Digest",
    retries: 1,
  },
  { cron: "0 16 * * 1" }, // Mondays 16:00 UTC
  async ({ step }) => {
    const employers = await step.run("load-active-employers", async () => {
      return db
        .select({
          employerId: usersTable.id,
          employerName: usersTable.name,
          employerEmail: usersTable.email,
          companyId: companiesTable.id,
        })
        .from(companiesTable)
        .innerJoin(usersTable, eq(companiesTable.ownerUserId, usersTable.id))
        .where(and(eq(usersTable.isDeleted, false), eq(usersTable.role, "employer")));
    });

    if (employers.length === 0) {
      return { scannedEmployers: 0, emailedEmployers: 0 };
    }

    const candidateSignals = await step.run("load-candidate-signal-snapshots", async () => {
      const archetypes = await db
        .select({
          userId: careerArchetypesTable.userId,
          archetypeName: careerArchetypesTable.archetypeName,
        })
        .from(careerArchetypesTable);

      const scores = await db
        .select({
          userId: interviewSessionsTable.userId,
          overallScore: interviewSessionsTable.overallScore,
        })
        .from(interviewSessionsTable)
        .where(
          and(
            eq(interviewSessionsTable.status, "completed"),
            isNull(interviewSessionsTable.deletedAt)
          )
        )
        .orderBy(desc(interviewSessionsTable.createdAt));

      const archetypeByUser = new Map<number, string>();
      for (const row of archetypes) {
        if (!archetypeByUser.has(row.userId)) archetypeByUser.set(row.userId, row.archetypeName);
      }

      const interviewByUser = new Map<number, number>();
      for (const row of scores) {
        if (row.overallScore == null) continue;
        if (!interviewByUser.has(row.userId)) interviewByUser.set(row.userId, row.overallScore);
      }

      return { archetypeByUser, interviewByUser };
    });

    let emailedEmployers = 0;

    for (const employer of employers) {
      const jobs = await step.run(`load-active-jobs-${employer.employerId}`, async () => {
        return db
          .select({
            id: jobsTable.id,
            title: jobsTable.title,
          })
          .from(jobsTable)
          .where(and(eq(jobsTable.companyId, employer.companyId), eq(jobsTable.status, "published")))
          .orderBy(desc(jobsTable.updatedAt))
          .limit(MAX_JOBS_PER_EMPLOYER);
      });

      if (jobs.length === 0) continue;

      const jobIds = jobs.map((job) => job.id);
      const candidateRows = await step.run(`load-job-match-candidates-${employer.employerId}`, async () => {
        return db
          .select({
            jobId: jobMatchesTable.jobId,
            userId: jobMatchesTable.userId,
            name: usersTable.name,
            matchScore: jobMatchesTable.matchScore,
            matchStatus: jobMatchesTable.status,
          })
          .from(jobMatchesTable)
          .innerJoin(usersTable, eq(jobMatchesTable.userId, usersTable.id))
          .where(
            and(
              inArray(jobMatchesTable.jobId, jobIds),
              eq(usersTable.openToOpportunities, true),
              eq(usersTable.isDeleted, false),
              ne(jobMatchesTable.status, "dismissed"),
              ne(jobMatchesTable.status, "applied"),
              ne(jobMatchesTable.status, "invited")
            )
          )
          .orderBy(desc(jobMatchesTable.matchScore), desc(jobMatchesTable.updatedAt));
      });

      const candidatesByJob = new Map<number, DigestCandidate[]>();
      for (const row of candidateRows) {
        const current = candidatesByJob.get(row.jobId) ?? [];
        if (current.length >= MAX_CANDIDATES_PER_JOB) continue;
        if (current.some((c) => c.userId === row.userId)) continue;

        current.push({
          userId: row.userId,
          name: row.name,
          matchScore: row.matchScore,
          archetypeName: candidateSignals.archetypeByUser.get(row.userId) ?? null,
          avgInterviewScore: candidateSignals.interviewByUser.get(row.userId) ?? null,
        });
        candidatesByJob.set(row.jobId, current);
      }

      const digestJobs = jobs
        .map((job) => ({
          jobId: job.id,
          title: job.title,
          candidates: candidatesByJob.get(job.id) ?? [],
        }))
        .filter((job) => job.candidates.length > 0);

      if (digestJobs.length === 0) continue;

      await step.run(`send-employer-digest-${employer.employerId}`, async () => {
        await sendWeeklyEmployerTopCandidatesDigestEmail(employer.employerEmail, {
          employerName: employer.employerName?.split(" ")[0] ?? "there",
          jobs: digestJobs,
        });
      });

      emailedEmployers += 1;
    }

    return {
      scannedEmployers: employers.length,
      emailedEmployers,
      maxJobsPerEmployer: MAX_JOBS_PER_EMPLOYER,
      maxCandidatesPerJob: MAX_CANDIDATES_PER_JOB,
    };
  }
);
