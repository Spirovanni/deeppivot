/**
 * Structured Logging Service (Axiom)
 *
 * Wraps @axiomhq/nextjs to provide a type-safe, level-aware logger that:
 *   - Ships logs to Axiom in production for search, alerting, and dashboards
 *   - Falls back to console.* in development / test so there's no Axiom dependency locally
 *   - Automatically enriches every log with `service`, `env`, and `timestamp`
 *
 * Env vars:
 *   AXIOM_DATASET   – Axiom dataset name  (required in production)
 *   AXIOM_TOKEN     – Axiom API token      (required in production)
 *   NODE_ENV        – "production" | "development" | "test"
 *
 * Usage:
 *   import { logger } from "@/src/lib/logger";
 *   logger.info("session.started", { sessionId, userId });
 *   logger.error("payment.failed", { plan, error: err.message });
 */

import "server-only";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

export interface LogEntry extends LogFields {
  event: string;
  level: LogLevel;
  service: string;
  env: string;
  timestamp: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SERVICE_NAME = "deeppivot";
const ENV = process.env.NODE_ENV ?? "development";
const IS_PROD = ENV === "production";

// ─── Axiom client (lazy, only in production) ─────────────────────────────────

let _axiom: { ingest: (dataset: string, events: LogEntry[]) => Promise<void> } | null = null;

async function getAxiomClient() {
  if (!IS_PROD) return null;
  if (_axiom) return _axiom;

  const dataset = process.env.AXIOM_DATASET;
  const token = process.env.AXIOM_TOKEN;

  if (!dataset || !token) {
    console.warn("[logger] AXIOM_DATASET and AXIOM_TOKEN must be set in production.");
    return null;
  }

  const { Axiom } = await import("@axiomhq/js");
  const client = new Axiom({ token });

  _axiom = {
    ingest: (ds: string, events: LogEntry[]) => {
      client.ingest(ds, events);
      return client.flush();
    },
  };

  return _axiom;
}

// ─── Core log function ────────────────────────────────────────────────────────

async function log(level: LogLevel, event: string, fields?: LogFields) {
  const entry: LogEntry = {
    ...fields,
    event,
    level,
    service: SERVICE_NAME,
    env: ENV,
    timestamp: new Date().toISOString(),
  };

  if (IS_PROD) {
    const dataset = process.env.AXIOM_DATASET;
    if (dataset) {
      const client = await getAxiomClient();
      await client?.ingest(dataset, [entry]);
    }
  } else {
    const consoleFn =
      level === "error"
        ? console.error
        : level === "warn"
        ? console.warn
        : level === "debug"
        ? console.debug
        : console.log;

    consoleFn(`[${level.toUpperCase()}] ${event}`, fields ?? "");
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const logger = {
  /** Low-level diagnostic information (dev only by default) */
  debug: (event: string, fields?: LogFields) => log("debug", event, fields),

  /** Normal application events (session started, user created, etc.) */
  info: (event: string, fields?: LogFields) => log("info", event, fields),

  /** Non-fatal issues worth investigating */
  warn: (event: string, fields?: LogFields) => log("warn", event, fields),

  /** Errors that affect a request or user flow */
  error: (event: string, fields?: LogFields) => log("error", event, fields),
};
