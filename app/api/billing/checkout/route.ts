import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPolarClient, PLANS, type PlanTier } from "@/src/lib/polar";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/billing/checkout
 *
 * Creates a Polar checkout session for the requested plan.
 *
 * Body: { plan: "pro" | "enterprise" }
 *
 * Returns: { checkoutUrl: string }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const plan = body?.plan as PlanTier | undefined;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro' or 'enterprise'." },
        { status: 400 }
      );
    }

    const planConfig = PLANS[plan];
    if (!planConfig.polarProductId) {
      return NextResponse.json(
        { error: `Plan '${plan}' does not have a Polar product ID configured.` },
        { status: 422 }
      );
    }

    // Fetch the user's email to pre-fill checkout
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;

    // Also grab the DB user for the external reference
    const [dbUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const polar = getPolarClient();

    const checkout = await polar.checkouts.create({
      products: [planConfig.polarProductId],
      successUrl: `${appUrl}/dashboard/billing/success?checkoutId={CHECKOUT_ID}`,
      customerEmail: email,
      metadata: {
        clerkUserId: userId,
        dbUserId: dbUser?.id?.toString() ?? "",
        plan,
      },
    });

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("❌ Polar checkout error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
