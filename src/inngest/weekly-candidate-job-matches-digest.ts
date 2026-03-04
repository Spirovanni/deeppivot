/**
 * Inngest cron: Weekly digest email of top matched jobs for candidates.
 *
 * Phase 16.5 (deeppivot-309)
 */

import { and, desc, eq, ne } from "drizzle-orm";
import { inngest } from "@/src/inngest/client";
import { db } from "@/src/db";
import {
  companiesTable,
  jobMarketplaceApplicationsTable,
  jobMatchesTable,
  jobsTable,
  usersTable,
} from "@/src/db/schema";
import { sendWeeklyJobMatchesDigestEmail } from "@/src/lib/email";

const TOP_MATCHES_PER_USER = 5;

export const weeklyCandidateJobMatchesDigest = inngest.createFunction(
  {
    id: "weekly-candidate-job-matches-digest",
    name: "Weekly Candidate Job Matches Digest",
    retries: 1,
  },
  { cron: "0 15 * * 1" }, // Mondays 15:00 UTC
  async ({ step }) => {
    const users = await step.run("load-candidate-users", async () => {
      return db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.role, "user"),
            eq(usersTable.openToOpportunities, true),
            eq(usersTable.isDeleted, false)
          )
        );
    });

    if (users.length === 0) {
      return { scannedUsers: 0, emailedUsers: 0 };
    }

    let emailedUsers = 0;

    for (const user of users) {
      const matches = await step.run(`load-user-matches-${user.id}`, async () => {
        const rows = await db
          .select({
            jobId: jobMatchesTable.jobId,
            matchScore: jobMatchesTable.matchScore,
            title: jobsTable.title,
            companyName: companiesTable.name,
            location: jobsTable.location,
            remoteFlag: jobsTable.remoteFlag,
            applicationId: jobMarketplaceApplicationsTable.id,
          })
          .from(jobMatchesTable)
          .innerJoin(jobsTable, eq(jobMatchesTable.jobId, jobsTable.id))
          .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
          .leftJoin(
            jobMarketplaceApplicationsTable,
            and(
              eq(jobMarketplaceApplicationsTable.jobId, jobsTable.id),
              eq(jobMarketplaceApplicationsTable.userId, user.id)
            )
          )
          .where(
            and(
              eq(jobMatchesTable.userId, user.id),
              eq(jobsTable.status, "published"),
              ne(jobMatchesTable.status, "dismissed"),
              ne(jobMatchesTable.status, "applied")
            )
          )
          .orderBy(desc(jobMatchesTable.matchScore), desc(jobMatchesTable.updatedAt))
          .limit(TOP_MATCHES_PER_USER * 2);

        return rows
          .filter((row) => row.applicationId == null)
          .slice(0, TOP_MATCHES_PER_USER)
          .map((row) => ({
            jobId: row.jobId,
            title: row.title,
            companyName: row.companyName,
            matchScore: row.matchScore,
            location: row.location,
            remoteFlag: row.remoteFlag,
          }));
      });

      if (matches.length === 0) continue;

      await step.run(`send-digest-email-${user.id}`, async () => {
        await sendWeeklyJobMatchesDigestEmail(user.email, {
          userName: user.name?.split(" ")[0] ?? "there",
          jobs: matches,
        });
      });

      emailedUsers += 1;
    }

    return {
      scannedUsers: users.length,
      emailedUsers,
      topMatchesPerUser: TOP_MATCHES_PER_USER,
    };
  }
);
