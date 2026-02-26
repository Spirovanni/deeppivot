"use client";

/**
 * PostHog Analytics Provider
 *
 * Wraps the app in a PostHog context so all child components can call
 * usePostHog() for event capture, feature flags, and A/B tests.
 *
 * Env vars:
 *   NEXT_PUBLIC_POSTHOG_KEY  – PostHog project API key (required)
 *   NEXT_PUBLIC_POSTHOG_HOST – PostHog ingest host (default: https://app.posthog.com)
 *
 * Docs: https://posthog.com/docs/libraries/next-js
 */

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      // Route events through our own domain to avoid ad-blockers
      ui_host: "https://us.posthog.com",
      // Defer loading until after first interaction for performance
      loaded(ph) {
        if (process.env.NODE_ENV === "development") {
          ph.debug();
        }
      },
      // Don't capture page views automatically; use the Next.js router hook instead
      capture_pageview: false,
      // Respect Do-Not-Track header
      respect_dnt: true,
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
