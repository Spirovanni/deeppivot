"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  fetchUserCareerContext,
  generatePredictiveInsights,
  type PredictiveInsight,
} from "@/src/lib/predictive-career-analytics";

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

/**
 * Get predictive career insights for the current user.
 * Returns null if no insights could be generated (e.g. insufficient data).
 */
export async function getPredictiveInsights(): Promise<PredictiveInsight[] | null> {
  const userId = await getDbUserId();
  const context = await fetchUserCareerContext(userId);

  // Require at least some data to generate meaningful insights
  const hasData =
    context.archetype ||
    context.skills.length > 0 ||
    context.planGoals.length > 0 ||
    context.interviewPerformance.completedSessions > 0;

  if (!hasData) return null;

  try {
    const insights = await generatePredictiveInsights(context);
    return insights.length > 0 ? insights : null;
  } catch {
    // LLM unavailable (missing API keys, rate limit, etc.) — non-fatal
    return null;
  }
}
