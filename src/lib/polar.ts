/**
 * Polar Billing Integration
 *
 * Provides the Polar SDK client and plan configuration for DeepPivot's
 * subscription billing.
 *
 * Required env vars:
 *   POLAR_ACCESS_TOKEN        – Polar API access token (server-side only)
 *   POLAR_WEBHOOK_SECRET      – Webhook signing secret from Polar dashboard
 *   POLAR_PRODUCT_ID_PRO      – Polar product ID for the Pro tier
 *   POLAR_PRODUCT_ID_ENTERPRISE – Polar product ID for Enterprise tier
 *   NEXT_PUBLIC_APP_URL       – Base URL for success/return redirects
 *
 * Docs: https://polar.sh/docs/api-reference
 */

import "server-only";
import { Polar } from "@polar-sh/sdk";

// ─── Client singleton ────────────────────────────────────────────────────────

let _client: Polar | null = null;

export function getPolarClient(): Polar {
  if (_client) return _client;

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN must be set in environment variables.");
  }

  _client = new Polar({
    accessToken,
    server: process.env.POLAR_ENV === "sandbox" ? "sandbox" : "production",
  });

  return _client;
}

// ─── Plan configuration ───────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "enterprise";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  description: string;
  /** Monthly price in USD for display purposes */
  priceMonthly: number | null;
  features: string[];
  /** Polar product ID — null for the free tier (no checkout needed) */
  polarProductId: string | null;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with AI interview coaching",
    priceMonthly: 0,
    features: [
      "3 interview sessions / month",
      "General & behavioral interview types",
      "Basic transcript",
      "Career archetype quiz",
    ],
    polarProductId: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Unlimited coaching for serious job seekers",
    priceMonthly: 29,
    features: [
      "Unlimited interview sessions",
      "All interview types (behavioral, technical, situational, general)",
      "Full live transcript + emotion analysis",
      "Personalized career plan",
      "Mentor matching",
      "Education explorer",
      "Priority support",
    ],
    polarProductId: process.env.POLAR_PRODUCT_ID_PRO ?? null,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For teams, workforce boards, and employers",
    priceMonthly: null, // contact sales
    features: [
      "Everything in Pro",
      "Custom ElevenLabs agent per organization",
      "White-label theming",
      "Employer dashboard + job posting",
      "Workforce development board integrations (Salesforce, WDB)",
      "Dedicated support & SLA",
    ],
    polarProductId: process.env.POLAR_PRODUCT_ID_ENTERPRISE ?? null,
  },
};

export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLANS[tier];
}

export function getPlanByProductId(productId: string): PlanConfig | null {
  return (
    Object.values(PLANS).find((p) => p.polarProductId === productId) ?? null
  );
}
