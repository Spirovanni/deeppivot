/**
 * Signed tokens for secure CSV export links (deeppivot-313).
 * Admin generates a time-limited token; download route validates without session.
 */
import { createHmac, timingSafeEqual } from "crypto";

const EXPIRY_SECONDS = 900; // 15 minutes

export interface ExportTokenPayload {
  type: "users" | "interview_sessions";
  role?: string;
  includeDeleted?: boolean;
  /** ISO date for sessions export */
  from?: string;
  /** ISO date for sessions export */
  to?: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.EXPORT_SIGNING_SECRET ?? process.env.CLERK_SECRET_KEY;
  if (!secret || secret.length < 16) {
    throw new Error("EXPORT_SIGNING_SECRET or CLERK_SECRET_KEY required for export tokens");
  }
  return secret;
}

function base64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function base64urlDecode(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

/** Create a signed token for CSV export. */
export function createExportToken(payload: Omit<ExportTokenPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;
  const full: ExportTokenPayload = { ...payload, exp };
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(full)));
  const signature = createHmac("sha256", getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${base64urlEncode(signature)}`;
}

/** Verify and decode a signed token. Returns payload or null if invalid/expired. */
export function verifyExportToken(token: string): ExportTokenPayload | null {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;

    const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest();
    const actualSig = base64urlDecode(sigB64);
    if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(base64urlDecode(payloadB64)).toString("utf8")) as ExportTokenPayload;
    if (payload.exp < Date.now() / 1000) return null;
    if (payload.type !== "users" && payload.type !== "interview_sessions") return null;
    return payload;
  } catch {
    return null;
  }
}
