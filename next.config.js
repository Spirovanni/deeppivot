/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config - no CSP restrictions for development
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
      { protocol: "https", hostname: "img.clerk.com", pathname: "/**" },
      { protocol: "https", hostname: "images.clerk.dev", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      // Redirect www to apex to avoid Clerk CORS issues (clerk.deeppivots.com)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.deeppivots.com" }],
        destination: "https://deeppivots.com/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;