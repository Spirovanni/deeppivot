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

const REVALIDATE = "/dashboard/career-plan";

async function getDbUserId(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);
  if (!user) throw new Error("User not found");
  return user.id;
}

// ─── Milestone CRUD ───────────────────────────────────────────────────────────

export interface MilestoneInput {
  title: string;
  description?: string;
  targetDate?: string; // ISO date string
  status?: string;
}

export async function createMilestone(data: MilestoneInput): Promise<void> {
  const userId = await getDbUserId();

  // Get max orderIndex to append at the end
  const rows = await db
    .select({ orderIndex: careerMilestonesTable.orderIndex })
    .from(careerMilestonesTable)
    .where(eq(careerMilestonesTable.userId, userId))
    .orderBy(asc(careerMilestonesTable.orderIndex));

  const nextOrder = rows.length > 0 ? rows[rows.length - 1].orderIndex + 1 : 0;

  await db.insert(careerMilestonesTable).values({
    userId,
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
  const userId = await getDbUserId();

  await db
    .update(careerMilestonesTable)
    .set({
      title: data.title,
      description: data.description ?? null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      status: data.status ?? "planned",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(careerMilestonesTable.id, milestoneId),
        eq(careerMilestonesTable.userId, userId)
      )
    );

  revalidatePath(REVALIDATE);
}

export async function deleteMilestone(milestoneId: number): Promise<void> {
  const userId = await getDbUserId();

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
