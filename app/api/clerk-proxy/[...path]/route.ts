/**
 * Proxies Clerk Frontend API requests to avoid CORS.
 * Forwards to Clerk's default frontend-api.clerk.dev (per Clerk docs).
 * Set proxyUrl="/api/clerk-proxy" in ClerkProvider.
 */
import { NextRequest, NextResponse } from "next/server";

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, ctx);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, ctx);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, ctx);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, ctx);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, ctx);
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = new Headers();

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Clerk-Secret-Key, X-Forwarded-For, X-Forwarded-Proto, X-Forwarded-Host");
  }

  return new NextResponse(null, { status: 204, headers });
}

async function proxyRequest(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const pathStr = path.join("/");
  const targetUrl = `${CLERK_FRONTEND_API}/${pathStr}${req.nextUrl.search}`;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("[clerk-proxy] CLERK_SECRET_KEY not set");
    return new NextResponse("Proxy misconfigured", { status: 500 });
  }

  // Normalize domain to apex (remove www) for Clerk
  const normalizedHost = req.nextUrl.host.replace(/^www\./, '');
  const proxyUrl = `https://${normalizedHost}/api/clerk-proxy`;
  const forwardedFor = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";

  const headers = new Headers(req.headers);
  headers.set("Clerk-Proxy-Url", proxyUrl);
  headers.set("Clerk-Secret-Key", secretKey);
  headers.set("X-Forwarded-For", forwardedFor);
  headers.set("X-Forwarded-Proto", req.headers.get("x-forwarded-proto") ?? "https");
  headers.set("X-Forwarded-Host", normalizedHost);

  try {
    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.text();
    }

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const resBody = await res.arrayBuffer();
    const resHeaders = new Headers();
    const contentType = res.headers.get("Content-Type");
    if (contentType) resHeaders.set("Content-Type", contentType);

    // Handle CORS for both www and apex domain
    const origin = req.headers.get("origin");
    if (origin) {
      resHeaders.set("Access-Control-Allow-Origin", origin);
      resHeaders.set("Access-Control-Allow-Credentials", "true");
      resHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      resHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    return new NextResponse(resBody, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[clerk-proxy]", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
