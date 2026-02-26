const { withSentryConfig } = require("@sentry/nextjs");
const { withAxiom } = require("@axiomhq/nextjs");

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

  // Silence known harmless warnings from heavy server-only packages
  serverExternalPackages: ["pg", "aws4fetch"],

  // Inline env vars that are safe to expose to the browser bundle
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },

  // Strict mode catches subtle React issues early
  reactStrictMode: true,

  // Compress responses in production
  compress: true,

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(self)",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Never cache API routes
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

// Wrap with Axiom (request logging) then Sentry (error tracking + source maps)
const axiomConfig = withAxiom(nextConfig);

module.exports = withSentryConfig(axiomConfig, {
  // Sentry build-time options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps only in CI/production; silence in local dev
  silent: !process.env.CI,

  // Automatically tree-shake Sentry logger statements in production
  disableLogger: true,

  // Route Sentry tunnel through own domain to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Automatically annotate React components with Sentry for better error context
  reactComponentAnnotation: { enabled: true },
});
