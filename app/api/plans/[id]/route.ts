import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
  usersTable,
  careerMilestonesTable,
  careerResourcesTable,
} from "@/src/db/schema";
import { eq, and, asc } from "drizzle-orm";

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

async function getMilestoneWithAuth(
  milestoneId: number,
  userId: number
) {
  return db.query.careerMilestonesTable.findFirst({
    where: and(
      eq(careerMilestonesTable.id, milestoneId),
      eq(careerMilestonesTable.userId, userId)
    ),
    with: {
      resources: {
        orderBy: [asc(careerResourcesTable.createdAt)],
      },
    },
  });
}

/**
 * GET /api/plans/[id]
 * Get a single milestone with its resources.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  const milestone = await getMilestoneWithAuth(id, userId);
  if (!milestone) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(milestone);
}

/**
 * PATCH /api/plans/[id]
 * Update a milestone.
 * Body: { title?, description?, targetDate?, status? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  const existing = await getMilestoneWithAuth(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.description !== undefined)
      updates.description = body.description ? String(body.description).trim() : null;
    if (body.targetDate !== undefined)
      updates.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    if (body.status !== undefined) updates.status = body.status;

    const [milestone] = await db
      .update(careerMilestonesTable)
      .set(updates as Record<string, Date | string | null>)
      .where(
        and(
          eq(careerMilestonesTable.id, id),
          eq(careerMilestonesTable.userId, userId)
        )
      )
      .returning();

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("[api/plans] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plans/[id]
 * Delete a milestone and its resources.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  const existing = await getMilestoneWithAuth(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  try {
    await db
      .delete(careerMilestonesTable)
      .where(
        and(
          eq(careerMilestonesTable.id, id),
          eq(careerMilestonesTable.userId, userId)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/plans] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
