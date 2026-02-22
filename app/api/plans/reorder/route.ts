import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
  usersTable,
  careerMilestonesTable,
} from "@/src/db/schema";
import { eq, and, inArray } from "drizzle-orm";

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
 * PUT /api/plans/reorder
 * Reorder milestones by providing the new order of IDs.
 * Body: { orderedIds: number[] }
 */
export async function PUT(request: NextRequest) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const orderedIds = body.orderedIds;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid orderedIds array" },
        { status: 400 }
      );
    }

    const ids = orderedIds.map((id: unknown) =>
      typeof id === "number" ? id : parseInt(String(id), 10)
    ).filter((id: number) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No valid milestone IDs provided" },
        { status: 400 }
      );
    }

    // Verify all milestones belong to user
    const userMilestones = await db
      .select({ id: careerMilestonesTable.id })
      .from(careerMilestonesTable)
      .where(
        and(
          eq(careerMilestonesTable.userId, userId),
          inArray(careerMilestonesTable.id, ids)
        )
      );

    if (userMilestones.length !== ids.length) {
      return NextResponse.json(
        { error: "One or more milestones not found or unauthorized" },
        { status: 403 }
      );
    }

    await Promise.all(
      ids.map((id, index) =>
        db
          .update(careerMilestonesTable)
          .set({ orderIndex: index, updatedAt: new Date() })
          .where(
            and(
              eq(careerMilestonesTable.id, id),
              eq(careerMilestonesTable.userId, userId)
            )
          )
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/plans] PUT reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder plans" },
      { status: 500 }
    );
  }
}
