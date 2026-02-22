import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
  usersTable,
  careerMilestonesTable,
  careerResourcesTable,
} from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

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
 * GET /api/plans
 * List all career milestones (plans) for the authenticated user.
 */
export async function GET() {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const milestones = await db.query.careerMilestonesTable.findMany({
      where: eq(careerMilestonesTable.userId, userId),
      orderBy: [asc(careerMilestonesTable.orderIndex)],
      with: {
        resources: {
          orderBy: [asc(careerResourcesTable.createdAt)],
        },
      },
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error("[api/plans] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plans
 * Create a new career milestone.
 * Body: { title, description?, targetDate?, status? }
 */
export async function POST(request: NextRequest) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    const rows = await db
      .select({ orderIndex: careerMilestonesTable.orderIndex })
      .from(careerMilestonesTable)
      .where(eq(careerMilestonesTable.userId, userId))
      .orderBy(asc(careerMilestonesTable.orderIndex));

    const nextOrder = rows.length > 0 ? rows[rows.length - 1].orderIndex + 1 : 0;

    const [milestone] = await db
      .insert(careerMilestonesTable)
      .values({
        userId,
        title,
        description: body.description?.trim() || null,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        status: body.status ?? "planned",
        orderIndex: nextOrder,
      })
      .returning();

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("[api/plans] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}
