import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyArchetype } from "../archetype-bert";
import { ARCHETYPES } from "../archetypes";

// Mock global fetch
global.fetch = vi.fn();

describe("classifyArchetype", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        process.env.HUGGINGFACE_API_KEY = "test-key";
    });

    it("should return null if API key is missing", async () => {
        delete process.env.HUGGINGFACE_API_KEY;
        const result = await classifyArchetype("test text");
        expect(result).toBeNull();
    });

    it("should return the top archetype on success", async () => {
        const mockResponse = {
            labels: ["The Strategist", "The Innovator"],
            scores: [0.8, 0.2],
        };

        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await classifyArchetype("I enjoy big picture planning");

        expect(result).not.toBeNull();
        expect(result?.archetypeId).toBe("strategist");
        expect(result?.score).toBe(0.8);
        expect(result?.scores[0].label).toBe("The Strategist");
    });

    it("should handle alternative label mapping (lowercase/no 'the')", async () => {
        const mockResponse = {
            labels: ["Innovator"],
            scores: [0.9],
        };

        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await classifyArchetype("I love creating new things");

        expect(result?.archetypeId).toBe("innovator");
    });

    it("should return null on API error", async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            text: () => Promise.resolve("Internal Error"),
        });

        const result = await classifyArchetype("test");
        expect(result).toBeNull();
    });
});
