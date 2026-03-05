"use client";

/**
 * PostHog Analytics Provider
 *
 * Wraps the app in a PostHog context so all child components can call
 * usePostHog() for event capture, feature flags, and A/B tests.
 *
 * Props are passed from the server layout to avoid process.env in client
 * (which triggers Next.js process polyfill and breaks Turbopack HMR).
 *
 * Docs: https://posthog.com/docs/libraries/next-js
 */

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PHProvider({
  children,
  posthogKey,
  posthogHost = "https://us.i.posthog.com",
  isDev = false,
}: {
  children: React.ReactNode;
  posthogKey?: string;
  posthogHost?: string;
  isDev?: boolean;
}) {
  useEffect(() => {
    if (!posthogKey) return;

    posthog.init(posthogKey, {
      api_host: posthogHost,
      ui_host: "https://us.posthog.com",
      loaded(ph) {
        if (isDev) ph.debug();
      },
      capture_pageview: false,
      respect_dnt: true,
    });
  }, [posthogKey, posthogHost, isDev]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
