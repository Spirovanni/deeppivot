/**
 * Database client — Neon Postgres with connection pooling
 *
 * Uses @neondatabase/serverless Pool for connection pooling in Node.js runtimes
 * (long-lived server processes, API routes, server actions).
 * Falls back to neon-http (single-request, stateless) for Edge runtimes that
 * cannot hold TCP sockets.
 *
 * Pool limits:
 *   NEON_POOL_SIZE        – max simultaneous connections (default: 10)
 *   NEON_IDLE_TIMEOUT_MS  – ms before an idle connection is released (default: 20 000)
 *   NEON_MAX_LIFETIME_MS  – max connection age in ms (default: 1 800 000 = 30 min)
 *
 * Neon's serverless driver supports WebSocket-based pooling out of the box:
 *   https://neon.tech/docs/serverless/serverless-driver
 */

import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// ─── Edge runtime: stateless HTTP (no TCP sockets) ────────────────────────────

function createHttpDb() {
  return drizzleHttp(process.env.DATABASE_URL!, { schema });
}

// ─── Node.js runtime: pooled WebSocket connections ────────────────────────────

let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;

  const maxSize = Number(process.env.NEON_POOL_SIZE) || 10;
  const idleTimeoutMs = Number(process.env.NEON_IDLE_TIMEOUT_MS) || 20_000;
  const maxLifetimeMs = Number(process.env.NEON_MAX_LIFETIME_MS) || 1_800_000;

  // Enable WebSocket transport for serverless + connection pooling
  if (typeof WebSocket !== "undefined") {
    neonConfig.webSocketConstructor = WebSocket;
  }

  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: maxSize,
    idleTimeoutMillis: idleTimeoutMs,
    maxUses: Math.floor(maxLifetimeMs / 1_000), // approximate via max-uses
  });

  return _pool;
}

function createPooledDb() {
  return drizzleServerless({ client: getPool(), schema });
}

// ─── Export ───────────────────────────────────────────────────────────────────

// Detect Edge runtime (Vercel Edge, Cloudflare Workers, etc.)
const isEdge =
  typeof process === "undefined" ||
  process.env.NEXT_RUNTIME === "edge" ||
  // @ts-expect-error EdgeRuntime is defined in edge environments
  typeof EdgeRuntime !== "undefined";

export const db = isEdge ? createHttpDb() : createPooledDb();

// Re-export Pool getter for direct pool access (e.g. raw SQL, advisory locks)
export { getPool };
