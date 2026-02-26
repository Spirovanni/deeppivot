import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/src/lib/polar";

export const metadata = {
  title: "Pricing — Deep Pivot",
  description:
    "Transparent pricing for AI-powered interview coaching and career development.",
};

export default function PricingPage() {
  const plans = [PLANS.free, PLANS.pro, PLANS.enterprise];

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900"
      id="main-content"
    >
      {/* Header */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          <Zap className="mr-1 size-3" aria-hidden="true" />
          Simple pricing
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Invest in your career
        </h1>
        <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
          Start free. Upgrade when you&apos;re ready. Cancel anytime.
        </p>
      </section>

      {/* Plan cards */}
      <section
        aria-label="Subscription plans"
        className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3"
      >
        {plans.map((plan) => {
          const isPro = plan.id === "pro";
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm dark:bg-slate-900 ${
                isPro
                  ? "border-violet-500 ring-2 ring-violet-500/20"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white hover:bg-violet-600">
                    Most popular
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {plan.name}
                </h2>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {plan.description}
                </p>
                <div className="mt-4 flex items-end gap-1">
                  {plan.priceMonthly === null ? (
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      Custom
                    </span>
                  ) : plan.priceMonthly === 0 ? (
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        ${plan.priceMonthly}
                      </span>
                      <span className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                        / month
                      </span>
                    </>
                  )}
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3" aria-label={`${plan.name} features`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-violet-600"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <PlanCTA plan={plan} isPro={isPro} />
            </div>
          );
        })}
      </section>

      {/* FAQ / note */}
      <section className="mx-auto max-w-2xl px-6 pb-24 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All plans include a 7-day free trial. No credit card required for the
          Free tier.{" "}
          <Link
            href="/dashboard"
            className="underline underline-offset-4 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Already a member?
          </Link>
        </p>
      </section>
    </main>
  );
}

function PlanCTA({
  plan,
  isPro,
}: {
  plan: (typeof PLANS)[keyof typeof PLANS];
  isPro: boolean;
}) {
  if (plan.id === "free") {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="/sign-up">Get started free</Link>
      </Button>
    );
  }

  if (plan.id === "enterprise") {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="mailto:hello@deeppivot.com?subject=Enterprise%20Inquiry">
          Contact sales
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild className={`w-full ${isPro ? "bg-violet-600 hover:bg-violet-700" : ""}`}>
      <Link href="/dashboard/billing">Upgrade to Pro</Link>
    </Button>
  );
}
