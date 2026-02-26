import { Webhooks } from "@polar-sh/nextjs";
import { db } from "@/src/db";
import { subscriptionsTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getPlanByProductId } from "@/src/lib/polar";
import { captureServerEvent } from "@/src/lib/posthog-server";


const webhookSecret = process.env.POLAR_WEBHOOK_SECRET ?? "";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getDbUserIdByClerkId(clerkId: string): Promise<number | null> {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  return user?.id ?? null;
}

async function upsertSubscription(
  userId: number,
  fields: {
    polarSubscriptionId: string;
    polarCustomerId?: string;
    polarProductId?: string;
    status: string;
    currentPeriodEnd?: Date | null;
    canceledAt?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }
) {
  const planConfig = fields.polarProductId
    ? getPlanByProductId(fields.polarProductId)
    : null;
  const planId = planConfig?.id ?? "free";

  await db
    .insert(subscriptionsTable)
    .values({
      userId,
      stripeSubscriptionId: fields.polarSubscriptionId,
      stripeCustomerId: fields.polarCustomerId,
      stripePriceId: fields.polarProductId,
      status: fields.status,
      planId,
      currentPeriodEnd: fields.currentPeriodEnd ?? null,
      canceledAt: fields.canceledAt ?? null,
      cancelAtPeriodEnd: fields.cancelAtPeriodEnd ?? false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptionsTable.userId,
      set: {
        stripeSubscriptionId: fields.polarSubscriptionId,
        stripeCustomerId: fields.polarCustomerId,
        stripePriceId: fields.polarProductId,
        status: fields.status,
        planId,
        currentPeriodEnd: fields.currentPeriodEnd ?? null,
        canceledAt: fields.canceledAt ?? null,
        cancelAtPeriodEnd: fields.cancelAtPeriodEnd ?? false,
        updatedAt: new Date(),
      },
    });
}

// ─── Webhook handler ─────────────────────────────────────────────────────────

export const POST = Webhooks({
  webhookSecret,

  // subscription.created — user just subscribed
  onSubscriptionCreated: async (payload) => {
    const sub = payload.data;
    const clerkId = sub.metadata?.clerkUserId as string | undefined;
    if (!clerkId) {
      console.warn("polar webhook: subscription.created missing clerkUserId metadata");
      return;
    }

    const userId = await getDbUserIdByClerkId(clerkId);
    if (!userId) {
      console.warn("polar webhook: subscription.created — user not found for clerkId", clerkId);
      return;
    }

    await upsertSubscription(userId, {
      polarSubscriptionId: sub.id,
      polarCustomerId: sub.customerId ?? undefined,
      polarProductId: sub.productId ?? undefined,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    });

    // Analytics: Track new subscription
    captureServerEvent({
      distinctId: clerkId,
      event: "subscription_started",
      properties: { plan_id: sub.productId, status: sub.status },
    }).catch(() => { });

    console.log(`✅ Polar subscription created for userId=${userId}, plan=${sub.productId}`);
  },

  // subscription.active — payment confirmed, subscription becomes active
  onSubscriptionActive: async (payload) => {
    const sub = payload.data;
    const clerkId = sub.metadata?.clerkUserId as string | undefined;
    if (!clerkId) return;

    const userId = await getDbUserIdByClerkId(clerkId);
    if (!userId) return;

    await upsertSubscription(userId, {
      polarSubscriptionId: sub.id,
      polarCustomerId: sub.customerId ?? undefined,
      polarProductId: sub.productId ?? undefined,
      status: "active",
      currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    });

    console.log(`✅ Polar subscription activated for userId=${userId}`);
  },

  // subscription.updated — plan change, renewal, or metadata update
  onSubscriptionUpdated: async (payload) => {
    const sub = payload.data;
    const clerkId = sub.metadata?.clerkUserId as string | undefined;
    if (!clerkId) return;

    const userId = await getDbUserIdByClerkId(clerkId);
    if (!userId) return;

    await upsertSubscription(userId, {
      polarSubscriptionId: sub.id,
      polarCustomerId: sub.customerId ?? undefined,
      polarProductId: sub.productId ?? undefined,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    });

    console.log(`🔄 Polar subscription updated for userId=${userId}, status=${sub.status}`);
  },

  // subscription.canceled — user or admin canceled
  onSubscriptionCanceled: async (payload) => {
    const sub = payload.data;
    const clerkId = sub.metadata?.clerkUserId as string | undefined;
    if (!clerkId) return;

    const userId = await getDbUserIdByClerkId(clerkId);
    if (!userId) return;

    await upsertSubscription(userId, {
      polarSubscriptionId: sub.id,
      polarCustomerId: sub.customerId ?? undefined,
      polarProductId: sub.productId ?? undefined,
      status: "canceled",
      canceledAt: new Date(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? true,
      currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
    });

    console.log(`❌ Polar subscription canceled for userId=${userId}`);
  },

  // subscription.revoked — immediate access removal (non-payment, fraud, etc.)
  onSubscriptionRevoked: async (payload) => {
    const sub = payload.data;
    const clerkId = sub.metadata?.clerkUserId as string | undefined;
    if (!clerkId) return;

    const userId = await getDbUserIdByClerkId(clerkId);
    if (!userId) return;

    await db
      .update(subscriptionsTable)
      .set({
        status: "inactive",
        canceledAt: new Date(),
        planId: "free",
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.userId, userId));

    console.log(`🚫 Polar subscription revoked for userId=${userId} — downgraded to free`);
  },
});
