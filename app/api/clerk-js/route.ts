/**
 * Proxies the Clerk JS script to avoid CORS issues when using custom domain (clerk.deeppivots.com).
 * Set NEXT_PUBLIC_CLERK_JS_URL=/api/clerk-js (relative URL works for both local and production).
 */
import { NextResponse } from "next/server";

const CLERK_SCRIPT_URL =
  "https://clerk.deeppivots.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js";

export async function GET() {
  try {
    const res = await fetch(CLERK_SCRIPT_URL, {
      headers: { "User-Agent": "DeepPivot-Clerk-Proxy/1.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("[clerk-js proxy]", err);
    return new NextResponse("Failed to load Clerk", { status: 502 });
  }
}
