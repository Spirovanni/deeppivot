"use server";

import { db } from "@/src/db";
import { careerArchetypesTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { computeArchetype, type Answers } from "@/src/lib/archetypes";

async function getDbUserId(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user.id;
}

export async function submitAssessment(answers: Answers): Promise<void> {
  const userId = await getDbUserId();
  const { archetype, traits } = computeArchetype(answers);

  await db
    .insert(careerArchetypesTable)
    .values({
      userId,
      archetypeName: archetype.name,
      traits,
      strengths: archetype.strengths,
      growthAreas: archetype.growthAreas,
      assessedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: careerArchetypesTable.userId,
      set: {
        archetypeName: archetype.name,
        traits,
        strengths: archetype.strengths,
        growthAreas: archetype.growthAreas,
        assessedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  revalidatePath("/dashboard/archetype");
}

export async function getArchetype() {
  const userId = await getDbUserId();

  const [row] = await db
    .select()
    .from(careerArchetypesTable)
    .where(eq(careerArchetypesTable.userId, userId))
    .limit(1);

  return row ?? null;
}

export async function deleteArchetype(): Promise<void> {
  const userId = await getDbUserId();

  await db
    .delete(careerArchetypesTable)
    .where(eq(careerArchetypesTable.userId, userId));

  revalidatePath("/dashboard/archetype");
}
