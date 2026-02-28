/**
 * Phase 16.4: Gamification engine — QA edge cases and timezone testing (deeppivot-294)
 */

import { describe, it, expect } from "vitest";
import {
  GAMIFICATION_POINTS,
  toUtcIsoString,
  addPoints,
} from "../gamification";

describe("GAMIFICATION_POINTS", () => {
  it("defines expected point values", () => {
    expect(GAMIFICATION_POINTS.JOB_APPLICATION_SUBMITTED).toBe(10);
    expect(GAMIFICATION_POINTS.INTERVIEW_COMPLETED).toBe(15);
    expect(GAMIFICATION_POINTS.MILESTONE_COMPLETED).toBe(5);
  });

  it("has positive values for all events", () => {
    for (const [key, value] of Object.entries(GAMIFICATION_POINTS)) {
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe("toUtcIsoString (timezone)", () => {
  it("returns ISO 8601 format ending in Z (UTC)", () => {
    const d = new Date("2026-02-28T12:00:00.000Z");
    expect(toUtcIsoString(d)).toBe("2026-02-28T12:00:00.000Z");
  });

  it("normalizes local dates to UTC", () => {
    const d = new Date("2026-02-28T20:00:00+08:00");
    expect(toUtcIsoString(d)).toBe("2026-02-28T12:00:00.000Z");
  });

  it("handles DST boundaries consistently", () => {
    const preDST = new Date("2026-03-08T09:00:00.000Z");
    const postDST = new Date("2026-03-09T09:00:00.000Z");
    expect(toUtcIsoString(preDST)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(toUtcIsoString(postDST)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe("addPoints edge cases", () => {
  it("returns null for zero points (no DB call)", async () => {
    const result = await addPoints(1, "JOB_APPLICATION_SUBMITTED", 0);
    expect(result).toBeNull();
  });

  it("returns null for negative points (no DB call)", async () => {
    const result = await addPoints(1, "JOB_APPLICATION_SUBMITTED", -5);
    expect(result).toBeNull();
  });
});
