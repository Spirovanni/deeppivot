import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import {
  archetypeReviewQueueTable,
  careerArchetypesTable,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/src/lib/admin-auth";
import { ARCHETYPES } from "@/src/lib/archetypes";
import { rateLimit } from "@/src/lib/rate-limit";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/archetype-review/[id]
 * Approve or override an archetype review item.
 * Body: { action: "approve" | "override", overrideArchetypeName?: string }
 * Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const rl = await rateLimit(request, "ADMIN");
  if (!rl.success) return rl.response;

  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: { action?: string; overrideArchetypeName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, overrideArchetypeName } = body;
  if (action !== "approve" && action !== "override") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'override'" },
      { status: 400 }
    );
  }

  if (action === "override") {
    const validName = ARCHETYPES.some(
      (a) => a.name.toLowerCase() === (overrideArchetypeName ?? "").toLowerCase()
    );
    if (!overrideArchetypeName || !validName) {
      return NextResponse.json(
        {
          error:
            "overrideArchetypeName required and must be a valid archetype (e.g. The Strategist, The Innovator)",
        },
        { status: 400 }
      );
    }
  }

  const [item] = await db
    .select()
    .from(archetypeReviewQueueTable)
    .where(eq(archetypeReviewQueueTable.id, id))
    .limit(1);

  if (!item) {
    return NextResponse.json({ error: "Review item not found" }, { status: 404 });
  }

  if (item.status !== "pending") {
    return NextResponse.json(
      { error: "Item already reviewed" },
      { status: 400 }
    );
  }

  const adminUser = await requireAdmin();
  const now = new Date();

  if (action === "override") {
    const resolvedName =
      ARCHETYPES.find(
        (a) => a.name.toLowerCase() === overrideArchetypeName!.toLowerCase()
      )?.name ?? overrideArchetypeName!;

    await db
      .update(careerArchetypesTable)
      .set({
        archetypeName: resolvedName,
        updatedAt: now,
      })
      .where(eq(careerArchetypesTable.id, item.careerArchetypeId));
  }

  await db
    .update(archetypeReviewQueueTable)
    .set({
      status: action === "approve" ? "approved" : "overridden",
      reviewedAt: now,
      reviewedBy: adminUser.id,
      overrideArchetypeName:
        action === "override" ? overrideArchetypeName : null,
      updatedAt: now,
    })
    .where(eq(archetypeReviewQueueTable.id, id));

  return NextResponse.json({ ok: true, action });
}
