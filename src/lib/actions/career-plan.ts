"use server";

import { db } from "@/src/db";
import {
  careerMilestonesTable,
  careerResourcesTable,
  usersTable,
} from "@/src/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { addPointsForMilestoneCompletion } from "@/src/lib/gamification";

const REVALIDATE = "/dashboard/career-plan";

async function getDbUser(): Promise<{ id: number; organizationId: string | null }> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const [user] = await db
    .select({ id: usersTable.id, organizationId: usersTable.organizationId })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");

  if (orgId && orgId !== user.organizationId) {
    user.organizationId = orgId;
  }

  return user;
}

// ─── Milestone CRUD ───────────────────────────────────────────────────────────

export interface MilestoneInput {
  title: string;
  description?: string;
  targetDate?: string; // ISO date string
  status?: string;
}

export async function createMilestone(data: MilestoneInput): Promise<void> {
  const user = await getDbUser();
  const userId = user.id;

  // Get max orderIndex to append at the end
  const rows = await db
    .select({ orderIndex: careerMilestonesTable.orderIndex })
    .from(careerMilestonesTable)
    .where(and(
      eq(careerMilestonesTable.userId, userId),
      user.organizationId ? eq(careerMilestonesTable.organizationId, user.organizationId) : undefined
    ))
    .orderBy(asc(careerMilestonesTable.orderIndex));

  const nextOrder = rows.length > 0 ? rows[rows.length - 1].orderIndex + 1 : 0;

  await db.insert(careerMilestonesTable).values({
    userId,
    organizationId: user.organizationId,
    title: data.title,
    description: data.description ?? null,
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
    status: data.status ?? "planned",
    orderIndex: nextOrder,
  });

  revalidatePath(REVALIDATE);
}

export async function updateMilestone(
  milestoneId: number,
  data: MilestoneInput
): Promise<void> {
  const user = await getDbUser();
  const userId = user.id;

  // Fetch current status to detect completion transition
  const [existing] = await db
    .select({ status: careerMilestonesTable.status })
    .from(careerMilestonesTable)
    .where(
      and(
        eq(careerMilestonesTable.id, milestoneId),
        eq(careerMilestonesTable.userId, userId)
      )
    )
    .limit(1);

  const newStatus = data.status ?? "planned";

  await db
    .update(careerMilestonesTable)
    .set({
      title: data.title,
      description: data.description ?? null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(careerMilestonesTable.id, milestoneId),
        eq(careerMilestonesTable.userId, userId)
      )
    );

  // Award gamification points when milestone transitions to "completed"
  if (newStatus === "completed" && existing?.status !== "completed") {
    addPointsForMilestoneCompletion(userId, milestoneId, data.title);
  }

  revalidatePath(REVALIDATE);
}

export async function deleteMilestone(milestoneId: number): Promise<void> {
  const user = await getDbUser();
  const userId = user.id;

  await db
    .delete(careerMilestonesTable)
    .where(
      and(
        eq(careerMilestonesTable.id, milestoneId),
        eq(careerMilestonesTable.userId, userId)
      )
    );

  revalidatePath(REVALIDATE);
}

export async function reorderMilestones(
  orderedIds: number[]
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(careerMilestonesTable)
        .set({ orderIndex: index, updatedAt: new Date() })
        .where(eq(careerMilestonesTable.id, id))
    )
  );

  revalidatePath(REVALIDATE);
}

// ─── Resource CRUD ────────────────────────────────────────────────────────────

export interface ResourceInput {
  title: string;
  url: string;
  resourceType: string;
}

export async function addResource(
  milestoneId: number,
  data: ResourceInput
): Promise<void> {
  await db.insert(careerResourcesTable).values({
    milestoneId,
    title: data.title,
    url: data.url,
    resourceType: data.resourceType,
  });

  revalidatePath(REVALIDATE);
}

export async function removeResource(resourceId: number): Promise<void> {
  await db
    .delete(careerResourcesTable)
    .where(eq(careerResourcesTable.id, resourceId));

  revalidatePath(REVALIDATE);
}
