import { describe, it, expect } from "vitest";
import { getCoverLetterSystemPrompt } from "../prompts/cover-letter";

describe("Cover Letter Prompts", () => {
    it("generates a professional system prompt", () => {
        const prompt = getCoverLetterSystemPrompt("professional");
        expect(prompt).toContain("emphasizing reliability and results");
        expect(prompt).toContain("STAR Method");
    });

    it("generates a creative system prompt", () => {
        const prompt = getCoverLetterSystemPrompt("creative");
        expect(prompt).toContain("Bold, authentic, and memorable");
    });

    it("includes word count constraints", () => {
        const prompt = getCoverLetterSystemPrompt("professional");
        expect(prompt).toMatch(/250-400 words/i);
    });

    it("defaults to professional for unknown tones", () => {
        // @ts-ignore - testing runtime fallback
        const prompt = getCoverLetterSystemPrompt("invalid-tone");
        expect(prompt).toContain("emphasizing reliability and results");
    });
});
