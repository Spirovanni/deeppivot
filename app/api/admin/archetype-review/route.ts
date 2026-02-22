import { NextResponse } from "next/server";
import { db } from "@/src/db";
import {
  archetypeReviewQueueTable,
  usersTable,
} from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/src/lib/admin-auth";

/**
 * GET /api/admin/archetype-review
 * List archetype review queue items (pending first, then by createdAt desc).
 * Admin only.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const rows = await db
    .select({
      id: archetypeReviewQueueTable.id,
      careerArchetypeId: archetypeReviewQueueTable.careerArchetypeId,
      sessionId: archetypeReviewQueueTable.sessionId,
      userId: archetypeReviewQueueTable.userId,
      feedbackContent: archetypeReviewQueueTable.feedbackContent,
      aiArchetypeName: archetypeReviewQueueTable.aiArchetypeName,
      aiStrengths: archetypeReviewQueueTable.aiStrengths,
      aiGrowthAreas: archetypeReviewQueueTable.aiGrowthAreas,
      status: archetypeReviewQueueTable.status,
      overrideArchetypeName: archetypeReviewQueueTable.overrideArchetypeName,
      createdAt: archetypeReviewQueueTable.createdAt,
      userEmail: usersTable.email,
      userName: usersTable.name,
    })
    .from(archetypeReviewQueueTable)
    .innerJoin(
      usersTable,
      eq(archetypeReviewQueueTable.userId, usersTable.id)
    )
    .orderBy(desc(archetypeReviewQueueTable.createdAt))
    .limit(100);

  // Sort: pending first, then by createdAt desc
  const pending = rows.filter((r) => r.status === "pending");
  const others = rows.filter((r) => r.status !== "pending");
  const sorted = [...pending, ...others].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    const aTime = a.createdAt?.getTime() ?? 0;
    const bTime = b.createdAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  return NextResponse.json({ items: sorted });
}
