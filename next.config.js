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
};

module.exports = nextConfig;