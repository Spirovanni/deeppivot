import { describe, it, expect } from "vitest";
import { anonymize, anonymizeWithExclusions } from "../pii";

describe("PII Anonymization with Exclusions", () => {
    it("should anonymize standard PII", () => {
        const input = "My email is test@example.com and phone is 555-123-4567.";
        const result = anonymize(input);
        expect(result).toContain("[EMAIL]");
        expect(result).toContain("[PHONE]");
        expect(result).not.toContain("test@example.com");
        expect(result).not.toContain("555-123-4567");
    });

    it("should scrub names by default", () => {
        const input = "John Doe is a candidate.";
        const result = anonymize(input);
        expect(result).toContain("[NAME]");
        expect(result).not.toContain("John Doe");
    });

    it("should preserve specific exclusions", () => {
        const input = "John Doe is a candidate. His email is john.doe@example.com.";
        const result = anonymizeWithExclusions(input, ["John Doe"]);

        expect(result).toContain("John Doe");
        expect(result).toContain("[EMAIL]");
        expect(result).not.toContain("john.doe@example.com");
    });

    it("should handle the candidate name in the anonymize wrapper", () => {
        const input = "Hello Xavier Martinez, your phone is 123-456-7890.";
        const result = anonymize(input, ["Xavier Martinez"]);

        expect(result).toContain("Xavier Martinez");
        expect(result).toContain("[PHONE]");
        expect(result).not.toContain("123-456-7890");
    });

    it("should handle multiple exclusions and overlapping names", () => {
        const input = "John Doe and John Smith went to Seattle.";
        const result = anonymize(input, ["John Doe", "John Smith"]);

        expect(result).toContain("John Doe");
        expect(result).toContain("John Smith");
        expect(result).not.toContain("[NAME]");
    });

    it("should handle candidate name being part of other text", () => {
        const input = "Candidate: Xavier Martinez\nFeedback for Xavier Martinez: Excellent work.";
        const result = anonymize(input, ["Xavier Martinez"]);
        expect(result).toBe(input); // Nothing else to anonymize
    });
});
