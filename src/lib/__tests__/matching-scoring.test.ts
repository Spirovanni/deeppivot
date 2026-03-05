/**
 * Matching algorithm threshold validation (deeppivot-322)
 */

import { describe, it, expect } from "vitest";
import {
  toTokens,
  getJobKeywords,
  getResumeSkills,
  getResumeSkillTokens,
  parseYearsOfExperience,
  estimateSalaryExpectation,
  computeSalaryScore,
  computeOverlapScore,
} from "../matching-scoring";

describe("toTokens", () => {
  it("extracts tokens of length >= 3, excludes stop words", () => {
    const tokens = toTokens("Senior React Developer with 5 years experience");
    expect(tokens).toContain("senior");
    expect(tokens).toContain("react");
    expect(tokens).toContain("developer");
    expect(tokens).not.toContain("with");
    expect(tokens).not.toContain("job");
  });

  it("lowercases and normalizes", () => {
    const tokens = toTokens("Node.JS & TypeScript");
    expect(tokens.some((t) => t.includes("node") || t.includes("js"))).toBe(true);
  });
});

describe("getJobKeywords", () => {
  it("returns up to 80 unique tokens from title and description", () => {
    const kw = getJobKeywords("Software Engineer", "Build React apps and Node backend");
    expect(kw.size).toBeGreaterThan(0);
    expect(kw.size).toBeLessThanOrEqual(80);
  });
});

describe("getResumeSkills", () => {
  it("returns empty array for null/empty parsedData", () => {
    expect(getResumeSkills(null)).toEqual([]);
    expect(getResumeSkills({})).toEqual([]);
    expect(getResumeSkills({ skills: [] })).toEqual([]);
  });

  it("returns skills trimmed and limited to 25", () => {
    const skills = getResumeSkills({
      skills: ["  React  ", "TypeScript", "Node.js"].concat(Array(30).fill("X")),
    });
    expect(skills).toHaveLength(25);
    expect(skills[0]).toBe("React");
  });
});

describe("parseYearsOfExperience", () => {
  it("parses numeric string", () => {
    expect(parseYearsOfExperience("5 years")).toBe(5);
    expect(parseYearsOfExperience("10+ years")).toBe(10);
    expect(parseYearsOfExperience("2.5")).toBe(2.5);
  });

  it("returns null for non-string or no match", () => {
    expect(parseYearsOfExperience(null)).toBeNull();
    expect(parseYearsOfExperience(123)).toBeNull();
    expect(parseYearsOfExperience("N/A")).toBeNull();
  });
});

describe("estimateSalaryExpectation", () => {
  it("clamps between 30k and 250k", () => {
    expect(estimateSalaryExpectation(0)).toBeGreaterThanOrEqual(30000);
    expect(estimateSalaryExpectation(20)).toBeLessThanOrEqual(250000);
  });

  it("increases with years", () => {
    const low = estimateSalaryExpectation(2);
    const high = estimateSalaryExpectation(8);
    expect(high).toBeGreaterThan(low);
  });
});

describe("computeSalaryScore", () => {
  it("returns 50 when no salary or no experience", () => {
    expect(computeSalaryScore(null, null, null)).toBe(50);
    expect(computeSalaryScore(80000, 120000, null)).toBe(50);
  });

  it("returns 100 when expected salary is in range", () => {
    // 5 years -> ~105k expected; range 80-130k
    expect(computeSalaryScore(80000, 130000, 5)).toBe(100);
  });

  it("returns lower score when far from range", () => {
    const score = computeSalaryScore(200000, 250000, 2);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("always returns 0-100", () => {
    expect(computeSalaryScore(1, 1, 50)).toBeGreaterThanOrEqual(0);
    expect(computeSalaryScore(1, 1, 50)).toBeLessThanOrEqual(100);
  });
});

describe("computeOverlapScore", () => {
  it("returns 0 for empty job keywords", () => {
    expect(computeOverlapScore(new Set(), new Set(["react", "node"]))).toBe(0);
  });

  it("returns 100 when all keywords matched", () => {
    const job = new Set(["react", "node", "typescript"]);
    const resume = new Set(["react", "node", "typescript"]);
    expect(computeOverlapScore(job, resume)).toBe(100);
  });

  it("returns partial score for partial overlap", () => {
    const job = new Set(["react", "node", "typescript", "python"]);
    const resume = new Set(["react", "node"]);
    expect(computeOverlapScore(job, resume)).toBe(50);
  });

  it("returns 0 when no overlap", () => {
    const job = new Set(["java", "kotlin"]);
    const resume = new Set(["react", "node"]);
    expect(computeOverlapScore(job, resume)).toBe(0);
  });
});
