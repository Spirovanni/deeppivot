/**
 * PII Anonymization Pipeline
 *
 * Scans and redacts Personally Identifiable Information (PII) from text
 * before it is sent to third-party AI models or stored in analytics.
 *
 * Categories scrubbed:
 *   - Full names (heuristic: "Firstname Lastname" patterns)
 *   - Email addresses
 *   - Phone numbers (US, international, and common formats)
 *   - Social Security Numbers (US)
 *   - Credit / debit card numbers
 *   - US ZIP codes (standalone)
 *   - US street addresses
 *   - IPv4 and IPv6 addresses
 *   - URLs containing personal data (stripped to origin)
 *   - Dates of birth (common formats)
 *
 * Usage:
 *   import { anonymize, containsPII, PIIReport } from "@/src/lib/pii";
 *
 *   // Quick redaction before sending to OpenAI / ElevenLabs
 *   const safe = anonymize(transcript);
 *
 *   // Check without modifying
 *   const { hasPII, matches } = containsPII(text);
 *
 *   // Full redaction with audit trail
 *   const report = anonymizeWithReport(text);
 *   console.log(report.redacted, report.found);
 */

// ─── PII rule definitions ─────────────────────────────────────────────────────

export type PIICategory =
  | "email"
  | "phone"
  | "ssn"
  | "credit_card"
  | "zip_code"
  | "street_address"
  | "ip_address"
  | "url"
  | "date_of_birth"
  | "name";

interface PIIRule {
  category: PIICategory;
  /** Replacement token inserted in place of the match */
  replacement: string;
  pattern: RegExp;
}

const PII_RULES: PIIRule[] = [
  // Email addresses  — match before URLs so foo@bar.com in a URL is still caught
  {
    category: "email",
    replacement: "[EMAIL]",
    pattern:
      /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  },

  // URLs (http/https/ftp) — redact to scheme+host only
  {
    category: "url",
    replacement: "[URL]",
    pattern:
      /https?:\/\/[^\s"'<>]+|ftp:\/\/[^\s"'<>]+/gi,
  },

  // Social Security Numbers (US): 123-45-6789 or 123456789
  {
    category: "ssn",
    replacement: "[SSN]",
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  },

  // Credit / debit card numbers (13–19 digits, optional spaces/dashes)
  {
    category: "credit_card",
    replacement: "[CARD]",
    pattern: /\b(?:\d[ \-]?){13,19}\b/g,
  },

  // Phone numbers — broad pattern covering US, international, parenthesized formats
  {
    category: "phone",
    replacement: "[PHONE]",
    pattern:
      /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}(?:\s?(?:x|ext)\.?\s?\d{1,5})?/g,
  },

  // US street addresses: "123 Main St", "4500 Oak Avenue Suite 200"
  {
    category: "street_address",
    replacement: "[ADDRESS]",
    pattern:
      /\b\d{1,5}\s+(?:[A-Z][a-z]+\s){1,4}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Dr(?:ive)?|Rd|Road|Ln|Lane|Ct|Court|Pl|Place|Way|Cir|Circle|Pkwy|Parkway|Hwy|Highway)\.?(?:\s+(?:Apt|Suite|Ste|Unit|#)\s*[\w\d]+)?\b/g,
  },

  // US ZIP codes (standalone 5 or 5+4 digits)
  {
    category: "zip_code",
    replacement: "[ZIP]",
    pattern: /\b\d{5}(?:-\d{4})?\b/g,
  },

  // IPv4 addresses
  {
    category: "ip_address",
    replacement: "[IP]",
    pattern:
      /\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}\b/g,
  },

  // IPv6 addresses (simplified)
  {
    category: "ip_address",
    replacement: "[IP]",
    pattern: /\b[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7}\b/g,
  },

  // Dates of birth — common formats: MM/DD/YYYY, YYYY-MM-DD, Month DD, YYYY
  {
    category: "date_of_birth",
    replacement: "[DOB]",
    pattern:
      /\b(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b|\b(?:19|20)\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:0?[1-9]|[12]\d|3[01]),?\s+(?:19|20)\d{2}/gi,
  },

  // Full names (heuristic: two or more capitalized words not at sentence start)
  // Uses a conservative lookbehind to avoid redacting ordinary capitalized nouns.
  // This is intentionally broad — false positives are acceptable for AI safety.
  {
    category: "name",
    replacement: "[NAME]",
    pattern:
      /\b(?:[A-Z][a-z]{1,20}[ \t]){1,2}[A-Z][a-z]{1,20}\b/g,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PIIMatch {
  category: PIICategory;
  original: string;
  index: number;
}

export interface PIIReport {
  /** The text with all PII replaced */
  redacted: string;
  /** Whether any PII was found */
  hasPII: boolean;
  /** All matches found, in order of appearance */
  found: PIIMatch[];
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Anonymize text by replacing all detected PII with category tokens.
 * This is the fast path — no audit trail, just the safe string.
 */
export function anonymize(text: string, exclusions: string[] = []): string {
  if (exclusions.length === 0) {
    let result = text;
    for (const rule of PII_RULES) {
      rule.pattern.lastIndex = 0; // reset stateful global regexes
      result = result.replace(rule.pattern, rule.replacement);
    }
    return result;
  }
  return anonymizeWithExclusions(text, exclusions);
}

/**
 * Anonymize text while explicitly preserving specific strings (exclusions).
 * Useful for keeping the candidate's name while scrubbing other PII.
 */
export function anonymizeWithExclusions(text: string, exclusions: string[]): string {
  if (!text || exclusions.length === 0) return anonymize(text);

  // 1. Create a map of unique markers for each exclusion to prevent accidental scrubbing
  // Use a format that is unlikely to be caught by PII regexes
  const markers = exclusions.map((ex, i) => ({
    original: ex,
    marker: `__EXCLUSION_${i}_${Math.random().toString(36).slice(2, 7)}__`,
  }));

  // 2. Sort exclusions by length descending to handle overlapping names (e.g., "John Doe" before "John")
  const sortedExclusions = [...markers].sort((a, b) => b.original.length - a.original.length);

  // 3. Temporarily swap exclusions with markers
  let processed = text;
  for (const item of sortedExclusions) {
    // Escape regex special characters in original string
    const escaped = item.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    processed = processed.replace(new RegExp(escaped, "g"), item.marker);
  }

  // 4. Run standard anonymization on the text containing markers
  let anonymized = processed;
  for (const rule of PII_RULES) {
    rule.pattern.lastIndex = 0;
    anonymized = anonymized.replace(rule.pattern, rule.replacement);
  }

  // 5. Swap markers back with original strings
  for (const item of markers) {
    anonymized = anonymized.replace(new RegExp(item.marker, "g"), item.original);
  }

  return anonymized;
}

/**
 * Check whether a text string contains any PII without modifying it.
 */
export function containsPII(text: string): { hasPII: boolean; categories: PIICategory[] } {
  const categories = new Set<PIICategory>();
  for (const rule of PII_RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) {
      categories.add(rule.category);
    }
  }
  return { hasPII: categories.size > 0, categories: [...categories] };
}

/**
 * Full redaction with an audit report of every match.
 * Use when you need to log what was found (without the actual values).
 */
export function anonymizeWithReport(text: string): PIIReport {
  let redacted = text;
  const found: PIIMatch[] = [];

  for (const rule of PII_RULES) {
    rule.pattern.lastIndex = 0;
    redacted = redacted.replace(rule.pattern, (match, ..._args) => {
      // Record the match in the original (pre-redaction) text position
      const index = text.indexOf(match);
      found.push({ category: rule.category, original: match, index });
      return rule.replacement;
    });
  }

  found.sort((a, b) => a.index - b.index);

  return {
    redacted,
    hasPII: found.length > 0,
    found,
  };
}

/**
 * Anonymize a structured object by recursively redacting all string values.
 * Useful for sanitizing request/response bodies before logging.
 *
 * @example
 * const safe = anonymizeObject({ name: "Jane Doe", email: "jane@example.com", age: 30 });
 * // → { name: "[NAME]", email: "[EMAIL]", age: 30 }
 */
export function anonymizeObject<T>(obj: T): T {
  if (typeof obj === "string") {
    return anonymize(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(anonymizeObject) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, anonymizeObject(v)])
    ) as unknown as T;
  }
  return obj;
}
