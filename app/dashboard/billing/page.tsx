import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Check, CreditCard, Zap, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getUserSubscription } from "@/src/lib/actions/subscriptions";
import { PLANS, getPlanConfig } from "@/src/lib/polar";
import { UpgradeButton } from "./_components/UpgradeButton";

export const metadata = {
  title: "Billing — Deep Pivot",
  description: "Manage your DeepPivot subscription.",
};

export default async function BillingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const subscription = await getUserSubscription();
  const currentPlan = getPlanConfig(subscription.planId);
  const proPlan = getPlanConfig("pro");
  const isActive = ["active", "trialing"].includes(subscription.status);
  const isPaid = subscription.planId !== "free";

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing preferences.
        </p>
      </div>

      {/* Current plan card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-green-600" : ""}
                >
                  {isActive ? "Active" : subscription.status}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {currentPlan.description}
              </CardDescription>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-foreground">
                {currentPlan.priceMonthly === null
                  ? "Custom"
                  : currentPlan.priceMonthly === 0
                  ? "Free"
                  : `$${currentPlan.priceMonthly}/mo`}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="Included features">
            {currentPlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>

          {subscription.currentPeriodEnd && (
            <p className="text-xs text-muted-foreground">
              {subscription.cancelAtPeriodEnd ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="size-3.5" aria-hidden="true" />
                  Cancels on{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              ) : (
                <>
                  Renews on{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </>
              )}
            </p>
          )}

          {isPaid && (
            <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
              <ManageButton subscriptionId={subscription.polarSubscriptionId} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade card — only show if on free plan */}
      {!isPaid && (
        <Card className="border-violet-500/30 bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/20 dark:to-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-violet-600" aria-hidden="true" />
              Upgrade to Pro
            </CardTitle>
            <CardDescription>
              Unlock unlimited sessions, all interview types, and advanced
              analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="grid gap-2 sm:grid-cols-2">
              {proPlan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-violet-600" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div>
                <span className="text-3xl font-bold text-foreground">
                  ${proPlan.priceMonthly}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">/ month</span>
              </div>
              <UpgradeButton plan="pro" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise CTA */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">Enterprise plan</p>
            <p className="text-sm text-muted-foreground">
              Custom pricing for teams, employers, and workforce boards.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="mailto:hello@deeppivot.com?subject=Enterprise%20Inquiry">
              <CreditCard className="mr-2 size-4" aria-hidden="true" />
              Contact sales
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Link to public pricing */}
      <p className="text-center text-xs text-muted-foreground">
        <Link
          href="/pricing"
          className="underline underline-offset-4 hover:text-foreground"
        >
          View full pricing details →
        </Link>
      </p>
    </div>
  );
}

function ManageButton({ subscriptionId }: { subscriptionId: string | null }) {
  if (!subscriptionId) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/api/billing/portal">
        <CreditCard className="mr-2 size-4" aria-hidden="true" />
        Manage subscription
      </Link>
    </Button>
  );
}
