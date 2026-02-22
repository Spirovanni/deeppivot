"use server";

import { db } from "@/src/db";
import { jobApplicationsTable } from "@/src/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const REVALIDATE_PATH = "/dashboard/job-tracker";

export async function createJobApplication(data: {
  company: string;
  position: string;
  location?: string;
  salary?: string;
  jobUrl?: string;
  tags?: string;
  description?: string;
  notes?: string;
  columnId: number;
  userId: number;
}) {
  // Calculate order: +100 after the last item in the column
  const lastJob = await db
    .select({ order: jobApplicationsTable.order })
    .from(jobApplicationsTable)
    .where(eq(jobApplicationsTable.columnId, data.columnId))
    .orderBy(desc(jobApplicationsTable.order))
    .limit(1);

  const newOrder = lastJob.length > 0 ? lastJob[0].order + 100 : 0;

  const [job] = await db
    .insert(jobApplicationsTable)
    .values({
      company: data.company,
      position: data.position,
      location: data.location || null,
      salary: data.salary || null,
      jobUrl: data.jobUrl || null,
      description: data.description || null,
      notes: data.notes || null,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      columnId: data.columnId,
      userId: data.userId,
      order: newOrder,
    })
    .returning();

  revalidatePath(REVALIDATE_PATH);
  return job;
}

export async function updateJobApplication(
  id: number,
  data: {
    company?: string;
    position?: string;
    location?: string;
    salary?: string;
    jobUrl?: string;
    tags?: string;
    description?: string;
    notes?: string;
    columnId?: number;
    order?: number;
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.company !== undefined) updateData.company = data.company;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.salary !== undefined) updateData.salary = data.salary || null;
  if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl || null;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.columnId !== undefined) updateData.columnId = data.columnId;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.tags !== undefined) {
    updateData.tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }

  const [updated] = await db
    .update(jobApplicationsTable)
    .set(updateData)
    .where(eq(jobApplicationsTable.id, id))
    .returning();

  revalidatePath(REVALIDATE_PATH);
  return updated;
}

export async function deleteJobApplication(id: number) {
  await db
    .delete(jobApplicationsTable)
    .where(eq(jobApplicationsTable.id, id));

  revalidatePath(REVALIDATE_PATH);
}

export async function moveJobApplication(id: number, targetColumnId: number) {
  // Get max order in target column
  const lastJob = await db
    .select({ order: jobApplicationsTable.order })
    .from(jobApplicationsTable)
    .where(eq(jobApplicationsTable.columnId, targetColumnId))
    .orderBy(desc(jobApplicationsTable.order))
    .limit(1);

  const newOrder = lastJob.length > 0 ? lastJob[0].order + 100 : 0;

  await db
    .update(jobApplicationsTable)
    .set({ columnId: targetColumnId, order: newOrder, updatedAt: new Date() })
    .where(eq(jobApplicationsTable.id, id));

  revalidatePath(REVALIDATE_PATH);
}
