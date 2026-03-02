const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
// @axiomhq/nextjs v0.2+ no longer exports a withAxiom next.config wrapper;
// request logging is handled via instrumentation.ts instead.
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com", pathname: "/**" },
      { protocol: "https", hostname: "img.clerk.com", pathname: "/**" },
      { protocol: "https", hostname: "images.clerk.dev", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },

  // Packages that must never be bundled into the client.
  // - pg / aws4fetch: native bindings that cannot run in a browser
  // - playht: server-only TTS SDK that transitively depends on `axios`
  //   (axios uses the Node.js `process` polyfill which breaks Turbopack HMR)
  // - axios: listed explicitly so Turbopack never tries to factory it client-side
  serverExternalPackages: ["pg", "aws4fetch", "playht", "axios"],

  // Inline env vars that are safe to expose to the browser bundle
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },

  // Strict mode catches subtle React issues early
  reactStrictMode: true,

  // Compress responses in production
  compress: true,

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['@tabler/icons-react', 'lucide-react'],
  },

  // Disable source maps in production to reduce deployment size
  productionBrowserSourceMaps: false,

  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    /**
     * Content-Security-Policy
     *
     * Designed to be strict in production while permitting the trusted CDN
     * and third-party services we actually use (Clerk, Sentry, PostHog, etc.).
     *
     * Note: 'unsafe-inline' for style-src is required by Tailwind/Radix; hashed
     * inline styles from Next.js are exempt via nonce if added in the future.
     */
    const cspDirectives = [
      // Allow same-origin + specific CDNs for default content
      "default-src 'self'",
      // Scripts: self + Clerk + Sentry + PostHog + ElevenLabs
      [
        "script-src",
        "'self'",
        isDev ? "'unsafe-eval'" : "", // Next.js HMR needs eval in dev
        "'unsafe-inline'",            // Inline scripts from Next.js runtime
        "https://clerk.deeppivots.com",
        "https://*.clerk.accounts.dev",
        "https://js.clerk.dev",
        "https://clerk.dev",
        "https://cdn.jsdelivr.net",   // Potential Clerk dependency
        "https://us.posthog.com",
        "https://*.sentry.io",
        "https://widget.elevenlabs.io",
      ].filter(Boolean).join(" "),
      // Styles: self + inline (Tailwind/Radix)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self + R2 bucket + Clerk CDN + Google avatars + data URIs
      [
        "img-src",
        "'self'",
        "data:",
        "blob:",
        "https://*.r2.dev",
        "https://*.r2.cloudflarestorage.com",
        "https://img.clerk.com",
        "https://images.clerk.dev",
        "https://avatars.githubusercontent.com",
        "https://lh3.googleusercontent.com",
        "https://us.posthog.com",
      ].join(" "),
      // Connect: API calls, Sentry, PostHog, ElevenLabs WS, Clerk
      [
        "connect-src",
        "'self'",
        "https://*.sentry.io",
        "https://sentry.io",
        "https://us.posthog.com",
        "https://us-assets.posthog.com",
        "wss://api.elevenlabs.io",
        "https://api.elevenlabs.io",
        "https://clerk.deeppivots.com",
        "https://*.clerk.accounts.dev",
        "https://api.clerk.dev",
        "https://clerk-telemetry.com",
        "https://upstash.com",
        "https://*.upstash.io",
      ].join(" "),
      // Media: R2 recordings
      "media-src 'self' blob: https://*.r2.dev https://*.r2.cloudflarestorage.com",
      // Frames: deny by default (X-Frame-Options also set below)
      "frame-src 'none'",
      "frame-ancestors 'none'",
      // Workers / service workers
      "worker-src 'self' blob:",
      // Form actions: self only
      "form-action 'self'",
      // Upgrade insecure requests in production
      isDev ? "" : "upgrade-insecure-requests",
    ].filter(Boolean).join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          // ── Standard security headers ───────────────────────────────────────
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(self), payment=()",
          },
          // ── HSTS (production only — avoid HSTS loops in local dev) ──────────
          ...(isDev ? [] : [{
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          }]),
          // ── CSP ─────────────────────────────────────────────────────────────
          {
            key: isDev ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
            value: cspDirectives,
          },
          // ── Cross-origin isolation (needed for SharedArrayBuffer in future) ──
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

// Wrap with Sentry (error tracking + source maps), next-intl, then bundle analyzer
module.exports = withBundleAnalyzer(withNextIntl(withSentryConfig(nextConfig, {
  // Sentry build-time options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps only in CI/production; silence in local dev
  silent: !process.env.CI,

  // Skip source map upload if no auth token to reduce deployment size
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Hide source maps from generated client bundles to reduce size
  hideSourceMaps: true,

  // Disable telemetry to reduce network calls during build
  telemetry: false,

  // Route Sentry tunnel through own domain to avoid ad-blockers
  tunnelRoute: "/monitoring",

  webpack: {
    // Tree-shake Sentry logger statements in production
    treeshake: { removeDebugLogging: true },
    // Annotate React components for better error context
    reactComponentAnnotation: { enabled: true },
  },
})));

