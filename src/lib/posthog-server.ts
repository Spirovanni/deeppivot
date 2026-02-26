/**
 * PostHog Node.js SDK singleton — deeppivot-139
 *
 * Use this for server-side event tracking in API routes, Inngest functions,
 * and other server-only code where `usePostHog()` is not available.
 *
 * Usage:
 *   import { captureServerEvent } from "@/src/lib/posthog-server";
 *   await captureServerEvent({ distinctId: clerkUserId, event: "career_plan_created", properties: { ... } });
 */

import { PostHog } from "posthog-node";

let _posthog: PostHog | null = null;

function getPostHog(): PostHog | null {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return null;

    if (!_posthog) {
        _posthog = new PostHog(key, {
            host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
            // Flush immediately on serverless — don't wait for batch
            flushAt: 1,
            flushInterval: 0,
        });
    }
    return _posthog;
}

interface CaptureOptions {
    /** Clerk user ID or anonymous ID */
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
}

/**
 * Capture a server-side event in PostHog.
 * Silently no-ops if NEXT_PUBLIC_POSTHOG_KEY is not set.
 */
export async function captureServerEvent({ distinctId, event, properties }: CaptureOptions): Promise<void> {
    const ph = getPostHog();
    if (!ph) return;

    try {
        ph.capture({ distinctId, event, properties });
        await ph.flush();
    } catch (err) {
        // Never block the request for analytics failures
        console.warn("[posthog-server] Failed to capture event:", event, err);
    }
}
