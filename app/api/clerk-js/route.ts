/**
 * Proxies the Clerk JS script to avoid CORS issues when using custom domain (clerk.deeppivots.com).
 * Uses jsDelivr as primary CDN (faster than unpkg), with unpkg fallback.
 */
import { NextResponse } from "next/server";

const CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js",
  "https://unpkg.com/@clerk/clerk-js@5/dist/clerk.browser.js",
];

const FETCH_TIMEOUT_MS = 25000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DeepPivot/1.0)" },
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  for (const url of CDN_URLS) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) continue;
      const body = await res.arrayBuffer();
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    } catch (err) {
      console.warn("[clerk-js proxy] CDN failed:", url, err);
    }
  }
  console.error("[clerk-js proxy] All CDNs failed");
  return new NextResponse("Failed to load Clerk", { status: 502 });
}
