/**
 * API Rate Limiting using Upstash Redis + @upstash/ratelimit
 *
 * Provides per-IP and per-user rate limiting for critical API endpoints.
 *
 * Env vars:
 *   UPSTASH_REDIS_REST_URL   – Upstash Redis REST URL
 *   UPSTASH_REDIS_REST_TOKEN – Upstash Redis REST token
 *
 * If env vars are not set (e.g. local dev without Redis), rate limiting is
 * bypassed gracefully so local development is unaffected.
 *
 * Usage in an API route:
 *   import { rateLimit } from "@/src/lib/rate-limit";
 *
 *   export async function POST(req: NextRequest) {
 *     const rl = await rateLimit(req, "INTERVIEW_START");
 *     if (!rl.success) return rl.response;
 *     // ... handler logic
 *   }
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Limit profiles ───────────────────────────────────────────────────────────

/**
 * Pre-defined rate limit profiles.
 * Adjust these numbers based on production traffic patterns.
 */
export const RATE_LIMIT_PROFILES = {
  /** AI interview start — expensive, tightly limited */
  INTERVIEW_START: { requests: 5, window: "1 m" },
  /** AI gap analysis — expensive */
  GAP_ANALYSIS: { requests: 5, window: "1 m" },
  /** Cover letter generation (LLM call) — per-user, moderate limit */
  COVER_LETTER_GENERATE: { requests: 10, window: "1 m" },
  /** ElevenLabs signed URL generation */
  ELEVENLABS_URL: { requests: 10, window: "1 m" },
  /** Billing checkout — prevent double-submits */
  BILLING_CHECKOUT: { requests: 3, window: "1 m" },
  /** Alt-Ed Explorer API — public-facing search */
  ALT_ED_SEARCH: { requests: 60, window: "1 m" },
  /** General API endpoints */
  DEFAULT: { requests: 30, window: "1 m" },
  /** Auth-adjacent routes */
  AUTH: { requests: 10, window: "1 m" },
  /** Webhook ingestion — allow generous burst */
  WEBHOOK: { requests: 100, window: "1 m" },
  /** Admin routes */
  ADMIN: { requests: 20, window: "1 m" },
} as const;

export type RateLimitProfile = keyof typeof RATE_LIMIT_PROFILES;

// ─── Response types ───────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: true;
  remaining: number;
  reset: number;
}

export interface RateLimitBlocked {
  success: false;
  response: NextResponse;
}

type RateLimitOutcome = RateLimitResult | RateLimitBlocked;

// ─── Identifier helpers ───────────────────────────────────────────────────────

function getIdentifier(req: NextRequest, profile: RateLimitProfile): string {
  // Use Cloudflare/Vercel forwarded IP, falling back to x-real-ip
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  return `${profile}:${ip}`;
}

// ─── Lazy singleton Redis + Ratelimit ────────────────────────────────────────

type RatelimitInstance = {
  limit: (identifier: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

const instances = new Map<string, RatelimitInstance>();

async function getRatelimiter(profile: RateLimitProfile): Promise<RatelimitInstance | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Bypass gracefully in dev / when Redis is not configured
    return null;
  }

  if (instances.has(profile)) return instances.get(profile)!;

  const { Redis } = await import("@upstash/redis");
  const { Ratelimit } = await import("@upstash/ratelimit");

  const redis = new Redis({ url, token });
  const config = RATE_LIMIT_PROFILES[profile];

  // Parse window string "1 m" → { unit: "m", value: 1 }
  const [valueStr, unit] = config.window.split(" ");
  const value = parseInt(valueStr, 10);

  const unitMap: Record<string, "ms" | "s" | "m" | "h" | "d"> = {
    ms: "ms", s: "s", m: "m", h: "h", d: "d",
  };

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, `${value} ${unitMap[unit] ?? "m"}`),
    analytics: true,
    prefix: `deeppivot:rl:${profile}`,
  });

  instances.set(profile, limiter);
  return limiter;
}

// ─── Main rate limit function ─────────────────────────────────────────────────

export async function rateLimit(
  req: NextRequest,
  profile: RateLimitProfile = "DEFAULT"
): Promise<RateLimitOutcome> {
  const limiter = await getRatelimiter(profile);

  if (!limiter) {
    // Redis not configured — pass through
    return { success: true, remaining: 999, reset: 0 };
  }

  const identifier = getIdentifier(req, profile);
  const result = await limiter.limit(identifier);

  if (result.success) {
    return {
      success: true,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);

  return {
    success: false,
    response: NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Please retry after ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(RATE_LIMIT_PROFILES[profile].requests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    ),
  };
}

/**
 * Convenience: rate-limit by authenticated user ID instead of IP.
 * Falls back to IP if no userId provided.
 */
export async function rateLimitByUser(
  req: NextRequest,
  userId: string | number | null,
  profile: RateLimitProfile = "DEFAULT"
): Promise<RateLimitOutcome> {
  const limiter = await getRatelimiter(profile);
  if (!limiter) return { success: true, remaining: 999, reset: 0 };

  const identifier = userId
    ? `${profile}:user:${userId}`
    : getIdentifier(req, profile);

  const result = await limiter.limit(identifier);

  if (result.success) {
    return { success: true, remaining: result.remaining, reset: result.reset };
  }

  const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);
  return {
    success: false,
    response: NextResponse.json(
      { error: "Too many requests", retryAfter: retryAfterSeconds },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
        },
      }
    ),
  };
}
