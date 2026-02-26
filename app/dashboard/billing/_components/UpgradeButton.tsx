"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import type { PlanTier } from "@/src/lib/polar";

interface UpgradeButtonProps {
  plan: Extract<PlanTier, "pro" | "enterprise">;
  className?: string;
}

export function UpgradeButton({ plan, className }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Checkout error:", err);
      alert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      aria-disabled={loading}
      aria-busy={loading}
      className={`bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500 ${className ?? ""}`}
    >
      {loading ? (
        <>
          <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
          Redirecting…
        </>
      ) : (
        <>
          <Zap className="mr-2 size-4" aria-hidden="true" />
          Upgrade to {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </>
      )}
    </Button>
  );
}
