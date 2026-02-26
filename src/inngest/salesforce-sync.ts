/**
 * Inngest scheduled job: Salesforce → DeepPivot data sync
 *
 * Runs daily (or on-demand via event) to pull WDB client data from Salesforce
 * and reconcile it with the DeepPivot user database.
 *
 * What it does:
 *   1. Pulls updated Contacts from Salesforce (modified in last 25 hours)
 *   2. For each contact, upserts a DeepPivot user record if a matching email exists
 *   3. Optionally creates a mentor connection if the Salesforce contact is tagged
 *      as a WDB referral to an active mentor
 *   4. Logs sync stats and errors to the Axiom structured logger
 *
 * Env requirements:
 *   SALESFORCE_USERNAME, SALESFORCE_PASSWORD, SALESFORCE_SECURITY_TOKEN,
 *   SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_LOGIN_URL
 */

import { inngest } from "@/src/inngest/client";
import { db } from "@/src/db";
import { usersTable, mentorConnectionsTable, mentorsTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/src/lib/logger";

// ─── Salesforce Contact shape returned by SOQL ───────────────────────────────

interface SFContact {
  Id: string;
  FirstName: string | null;
  LastName: string;
  Email: string | null;
  Phone: string | null;
  Title: string | null;
  DeepPivot_User_ID__c: string | null;
  WDB_Referral_Mentor_Email__c: string | null;
  SystemModstamp: string;
}

// ─── Sync stats ───────────────────────────────────────────────────────────────

interface SyncStats {
  contactsQueried: number;
  usersMatched: number;
  usersUpdated: number;
  connectionsCreated: number;
  errors: string[];
}

// ─── Function ─────────────────────────────────────────────────────────────────

export const salesforceDailySync = inngest.createFunction(
  {
    id: "salesforce-daily-sync",
    name: "Salesforce: Daily WDB Data Sync",
    retries: 3,
    rateLimit: {
      limit: 1,
      period: "24h",
    },
  },
  // Trigger: daily cron at 03:00 UTC, or manually via event
  [
    { cron: "0 3 * * *" },
    { event: "salesforce.sync.requested" },
  ],
  async ({ step }) => {
    const stats: SyncStats = {
      contactsQueried: 0,
      usersMatched: 0,
      usersUpdated: 0,
      connectionsCreated: 0,
      errors: [],
    };

    // 1. Fetch recently-modified Salesforce contacts
    const contacts = await step.run("fetch-salesforce-contacts", async () => {
      // 25-hour window to handle any edge cases across the day boundary
      const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

      const { getSalesforceClient } = await import("@/src/lib/salesforce");
      const conn = await getSalesforceClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (conn.query as (soql: string) => Promise<{ records: SFContact[]; totalSize: number }>)(
        `SELECT Id, FirstName, LastName, Email, Phone, Title,
                DeepPivot_User_ID__c, WDB_Referral_Mentor_Email__c, SystemModstamp
         FROM Contact
         WHERE SystemModstamp >= ${since}
           AND Email != null
         ORDER BY SystemModstamp DESC
         LIMIT 500`
      );

      return result.records ?? [];
    });

    stats.contactsQueried = contacts.length;

    if (contacts.length === 0) {
      await logger.info("salesforce.sync.no_updates", { stats });
      return stats;
    }

    // 2. Process each contact in batches
    const BATCH_SIZE = 25;
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);

      await step.run(`process-batch-${i / BATCH_SIZE}`, async () => {
        for (const contact of batch) {
          if (!contact.Email) continue;

          try {
            // Find matching DeepPivot user by email
            const [user] = await db
              .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, wdbSalesforceContactId: usersTable.wdbSalesforceContactId })
              .from(usersTable)
              .where(eq(usersTable.email, contact.Email))
              .limit(1);

            if (!user) continue;
            stats.usersMatched++;

            // Update user name + link WDB record if Salesforce data is present
            const sfName = [contact.FirstName, contact.LastName].filter(Boolean).join(" ").trim();
            const updatePayload: Record<string, unknown> = {};

            if (sfName && sfName !== user.name) {
              updatePayload.name = sfName;
              stats.usersUpdated++;
            }

            // Link Salesforce Contact ID as WDB record if not already linked
            if (contact.Id && !user.wdbSalesforceContactId) {
              updatePayload.wdbSalesforceContactId = contact.Id;
              updatePayload.wdbEnrolledAt = new Date();
            }

            if (Object.keys(updatePayload).length > 0) {
              await db
                .update(usersTable)
                .set({ ...updatePayload, updatedAt: new Date() })
                .where(eq(usersTable.id, user.id));
            }

            // Create mentor connection if WDB referred this contact to a mentor
            if (contact.WDB_Referral_Mentor_Email__c) {
              await createMentorConnectionIfNeeded(
                user.id,
                contact.WDB_Referral_Mentor_Email__c,
                stats
              );
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            stats.errors.push(`Contact ${contact.Id}: ${msg}`);
          }
        }
      });
    }

    // 3. Log completion
    await step.run("log-sync-complete", async () => {
      await logger.info("salesforce.sync.complete", {
        contactsQueried: stats.contactsQueried,
        usersMatched: stats.usersMatched,
        usersUpdated: stats.usersUpdated,
        connectionsCreated: stats.connectionsCreated,
        errorCount: stats.errors.length,
      });

      if (stats.errors.length > 0) {
        await logger.warn("salesforce.sync.errors", { errors: stats.errors.slice(0, 10) });
      }

      return { ok: true };
    });

    return stats;
  }
);

// ─── Helper: create mentor connection if not already connected ────────────────

async function createMentorConnectionIfNeeded(
  userId: number,
  mentorEmail: string,
  stats: SyncStats
): Promise<void> {
  // Look up mentor by their contact URL or name heuristic.
  // Since mentorsTable has no userId or email, we do a best-effort match by
  // checking if any active mentor's contactUrl contains the email.
  // In a production deployment, add an email column to mentors.
  const allMentors = await db
    .select({ id: mentorsTable.id, contactUrl: mentorsTable.contactUrl })
    .from(mentorsTable)
    .where(eq(mentorsTable.isActive, true));

  const mentor = allMentors.find(
    (m) => m.contactUrl && m.contactUrl.toLowerCase().includes(mentorEmail.toLowerCase())
  );

  if (!mentor) return;

  // Check if connection already exists
  const [existing] = await db
    .select({ id: mentorConnectionsTable.id })
    .from(mentorConnectionsTable)
    .where(
      and(
        eq(mentorConnectionsTable.userId, userId),
        eq(mentorConnectionsTable.mentorId, mentor.id)
      )
    )
    .limit(1);

  if (existing) return;

  await db.insert(mentorConnectionsTable).values({
    userId,
    mentorId: mentor.id,
    status: "active",
    message: "Created via Salesforce WDB referral sync",
  });

  stats.connectionsCreated++;
}
