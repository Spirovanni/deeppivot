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

async function getMilestoneWithAuth(milestoneId: number, userId: number) {
  return db.query.careerMilestonesTable.findFirst({
    where: and(
      eq(careerMilestonesTable.id, milestoneId),
      eq(careerMilestonesTable.userId, userId)
    ),
  });
}

/**
 * POST /api/plans/[id]/resources
 * Add a resource to a milestone.
 * Body: { title, url, resourceType? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  const milestone = await getMilestoneWithAuth(id, userId);
  if (!milestone) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title?.trim();
    const url = body.url?.trim();
    if (!title || !url) {
      return NextResponse.json(
        { error: "Missing required fields: title, url" },
        { status: 400 }
      );
    }

    const [resource] = await db
      .insert(careerResourcesTable)
      .values({
        milestoneId: id,
        title,
        url,
        resourceType: body.resourceType ?? "article",
      })
      .returning();

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("[api/plans] POST resource error:", error);
    return NextResponse.json(
      { error: "Failed to add resource" },
      { status: 500 }
    );
  }
}
