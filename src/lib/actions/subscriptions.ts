"use server";

import { db } from "@/src/db";
import { subscriptionsTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import type { PlanTier } from "@/src/lib/polar";

export type UserSubscription = {
  planId: PlanTier;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  polarSubscriptionId: string | null;
};

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

/** Return the current user's subscription, or a free-tier default if none exists. */
export async function getUserSubscription(): Promise<UserSubscription> {
  const userId = await getDbUserId();

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  if (!sub) {
    return {
      planId: "free",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      polarSubscriptionId: null,
    };
  }

  return {
    planId: (sub.planId as PlanTier) ?? "free",
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    polarSubscriptionId: sub.stripeSubscriptionId ?? null,
  };
}
