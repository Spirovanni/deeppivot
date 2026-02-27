/**
 * PII anonymization smoke test.
 *
 * Usage:
 *   npx tsx scripts/test-pii.ts
 */

import { anonymize, containsPII } from "../src/lib/pii";

const sample = `
Hi, my name is Sarah Johnson and I work at Google.
You can reach me at sarah.johnson@gmail.com or call 555-123-4567.
My SSN is 123-45-6789 and I live at 42 Oak Avenue, zip 90210.
My date of birth is 03/15/1990.
`;

const redacted = anonymize(sample);
const { hasPII, categories } = containsPII(sample);

console.log("=== PII Anonymization Test ===\n");
console.log("Original:\n", sample);
console.log("Redacted:\n", redacted);
console.log("PII detected:", hasPII);
console.log("Categories found:", categories.join(", "));

// Assertions
let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== Assertions ===");
assert("Email is masked", !redacted.includes("sarah.johnson@gmail.com") && redacted.includes("[EMAIL]"));
assert("Phone is masked", !redacted.includes("555-123-4567") && redacted.includes("[PHONE]"));
assert("SSN is masked", !redacted.includes("123-45-6789") && redacted.includes("[SSN]"));
assert("Name is masked", !redacted.includes("Sarah Johnson") && redacted.includes("[NAME]"));
assert("ZIP is masked", !redacted.includes("90210") && redacted.includes("[ZIP]"));
assert("DOB is masked", !redacted.includes("03/15/1990") && redacted.includes("[DOB]"));
assert("containsPII returns true", hasPII);
assert("Multiple categories detected", categories.length >= 4);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
