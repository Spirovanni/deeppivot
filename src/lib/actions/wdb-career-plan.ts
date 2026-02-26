"use server";

/**
 * WDB Career Plan Integration
 *
 * Links a user's DeepPivot career plan milestones to their official WDB case plan.
 * When a user is identified as a WDB client (via Salesforce sync), career plan
 * builders can optionally align their goals with WDB-defined objectives.
 */

import { db } from "@/src/db";
import {
  usersTable,
  careerMilestonesTable,
} from "@/src/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { WdbAlignedMilestone, WdbStatus } from "@/src/lib/wdb-templates";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WdbLinkInput {
  salesforceContactId: string;
  casePlanId: string;
  enrolledAt?: string; // ISO date string
}

// WdbStatus is defined in wdb-templates.ts (client-safe); re-used here.

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Not authenticated");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.clerkId, clerkUser.id), isNull(usersTable.deletedAt)))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user;
}

// ─── Get WDB status ───────────────────────────────────────────────────────────

export async function getWdbStatus(): Promise<WdbStatus> {
  const user = await getAuthenticatedUser();

  return {
    isWdbClient: !!user.wdbSalesforceContactId,
    salesforceContactId: user.wdbSalesforceContactId ?? null,
    casePlanId: user.wdbCasePlanId ?? null,
    enrolledAt: user.wdbEnrolledAt ?? null,
  };
}

// ─── Link WDB record ──────────────────────────────────────────────────────────

/**
 * Link a DeepPivot user to their Salesforce WDB record.
 * Called by admins or the Inngest Salesforce sync job.
 */
export async function linkWdbRecord(
  dbUserId: number,
  link: WdbLinkInput
): Promise<void> {
  await db
    .update(usersTable)
    .set({
      wdbSalesforceContactId: link.salesforceContactId,
      wdbCasePlanId: link.casePlanId,
      wdbEnrolledAt: link.enrolledAt ? new Date(link.enrolledAt) : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, dbUserId));
}

// ─── Create WDB-aligned milestones ────────────────────────────────────────────

/**
 * Create career milestones pre-populated with WDB IEP goals.
 * Milestones are tagged with the WDB category in the description.
 * The user can customise them freely after creation.
 */
export async function createWdbAlignedMilestones(
  milestones: WdbAlignedMilestone[]
): Promise<void> {
  const user = await getAuthenticatedUser();

  if (!user.wdbSalesforceContactId) {
    throw new Error("You must be linked to a WDB record to use this feature.");
  }

  // Get current milestone count for ordering
  const existing = await db
    .select({ orderIndex: careerMilestonesTable.orderIndex })
    .from(careerMilestonesTable)
    .where(and(
      eq(careerMilestonesTable.userId, user.id),
      isNull(careerMilestonesTable.deletedAt),
      user.organizationId ? eq(careerMilestonesTable.organizationId, user.organizationId) : undefined
    ))
    .orderBy(careerMilestonesTable.orderIndex);

  const startIndex = existing.length > 0
    ? (existing[existing.length - 1]?.orderIndex ?? 0) + 1
    : 0;

  const values = milestones.map((m, i) => ({
    userId: user.id,
    organizationId: user.organizationId,
    title: m.title,
    description: `[WDB: ${m.category}]\n\n${m.description}`.trim(),
    targetDate: m.targetDate ? new Date(m.targetDate) : null,
    status: "planned" as const,
    orderIndex: startIndex + i,
  }));

  if (values.length > 0) {
    await db.insert(careerMilestonesTable).values(values);
  }

  revalidatePath("/dashboard/career-plan");
}

