import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable, careerMilestonesTable } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { recommendResources } from "@/src/lib/curated-resources";

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
 * GET /api/plans/[id]/resources/recommendations
 * Returns curated resource suggestions for a milestone based on its title and description.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid milestone ID" }, { status: 400 });
  }

  const milestone = await db.query.careerMilestonesTable.findFirst({
    where: and(
      eq(careerMilestonesTable.id, id),
      eq(careerMilestonesTable.userId, userId)
    ),
  });

  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const goalText = [milestone.title, milestone.description]
    .filter(Boolean)
    .join(" ");

  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") ?? "6", 10) || 6,
    12
  );

  const recommendations = recommendResources(goalText, limit);

  return NextResponse.json(
    recommendations.map(({ matchCount, ...r }) => ({
      title: r.title,
      url: r.url,
      resourceType: r.resourceType,
    }))
  );
}
