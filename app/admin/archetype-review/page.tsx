import { db } from "@/src/db";
import {
  archetypeReviewQueueTable,
  usersTable,
} from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { ArchetypeReviewQueue } from "@/components/admin/ArchetypeReviewQueue";

export default async function ArchetypeReviewPage() {
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

  const items = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt?.toISOString() ?? "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Archetype Review Queue
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review AI-assigned career archetypes. Approve or override with a
          different archetype.
        </p>
      </div>

      <ArchetypeReviewQueue items={items} />
    </div>
  );
}
