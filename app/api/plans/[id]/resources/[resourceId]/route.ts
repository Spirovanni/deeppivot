import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
  usersTable,
  careerMilestonesTable,
  careerResourcesTable,
} from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

async function getDbUserId(): Promise<number | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  return user?.id ?? null;
}

/**
 * DELETE /api/plans/[id]/resources/[resourceId]
 * Remove a resource from a milestone.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, resourceId } = await params;
  const milestoneId = parseInt(id, 10);
  const resourceIdNum = parseInt(resourceId, 10);
  if (isNaN(milestoneId) || isNaN(resourceIdNum)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Verify milestone belongs to user and resource belongs to milestone
  const [resource] = await db
    .select({
      resourceId: careerResourcesTable.id,
      milestoneUserId: careerMilestonesTable.userId,
    })
    .from(careerResourcesTable)
    .innerJoin(
      careerMilestonesTable,
      eq(careerResourcesTable.milestoneId, careerMilestonesTable.id)
    )
    .where(
      and(
        eq(careerResourcesTable.id, resourceIdNum),
        eq(careerResourcesTable.milestoneId, milestoneId),
        eq(careerMilestonesTable.userId, userId)
      )
    )
    .limit(1);

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  try {
    await db
      .delete(careerResourcesTable)
      .where(eq(careerResourcesTable.id, resourceIdNum));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/plans] DELETE resource error:", error);
    return NextResponse.json(
      { error: "Failed to remove resource" },
      { status: 500 }
    );
  }
}
