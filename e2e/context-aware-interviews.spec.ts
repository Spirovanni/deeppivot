import { expect, test } from "@playwright/test";

/**
 * Context-Aware "Job Specific" Practice Interviews — E2E QA (deeppivot-210)
 *
 * Covers the public/unauthenticated surface of the context-aware interview
 * pipeline and API layer. Auth-gated flows (starting a session, gap analysis
 * panel) require a seeded user fixture and are validated here via API-level
 * assertions and redirect expectations.
 */

test.describe("Job Descriptions API", () => {
  test("GET /api/job-descriptions requires auth", async ({ request }) => {
    const res = await request.get("/api/job-descriptions");
    expect(res.status()).toBe(401);
  });

  test("POST /api/job-descriptions requires auth", async ({ request }) => {
    const res = await request.post("/api/job-descriptions", {
      data: { positionTitle: "Software Engineer", rawContent: "Test JD" },
    });
    expect(res.status()).toBe(401);
  });

  test("PATCH /api/job-descriptions/:id requires auth", async ({ request }) => {
    const res = await request.patch("/api/job-descriptions/1", {
      data: { positionTitle: "Updated Title" },
    });
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/job-descriptions/:id requires auth", async ({ request }) => {
    const res = await request.delete("/api/job-descriptions/1");
    expect(res.status()).toBe(401);
  });
});

test.describe("Context-Aware Interview Start API", () => {
  test("POST /api/interviews/context-aware/start requires auth", async ({ request }) => {
    const res = await request.post("/api/interviews/context-aware/start", {
      data: { sessionType: "behavioral", jobDescriptionId: 1 },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("JD Question Generation APIs", () => {
  test("POST /api/interviews/questions/generate requires auth", async ({ request }) => {
    const res = await request.post("/api/interviews/questions/generate", {
      data: { jobDescriptionId: 1 },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/interviews/questions/behavioral requires auth", async ({ request }) => {
    const res = await request.post("/api/interviews/questions/behavioral", {
      data: { jobDescriptionId: 1 },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/interviews/feedback/relevance requires auth", async ({ request }) => {
    const res = await request.post("/api/interviews/feedback/relevance", {
      data: { sessionId: 1, jobDescriptionId: 1 },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("JD Semantic Search API", () => {
  test("POST /api/job-descriptions/search requires auth", async ({ request }) => {
    const res = await request.post("/api/job-descriptions/search", {
      data: { query: "react developer" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Context-Aware Interview Session UI", () => {
  test("interview session page redirects to sign-in when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/interviews/session");
    const url = page.url();
    expect(
      url.includes("/sign-in") ||
        url.includes("/sign-up") ||
        url.includes("/unauthorized")
    ).toBeTruthy();
  });

  test("interview feedback page redirects to sign-in when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard/interviews/999/feedback");
    const url = page.url();
    expect(
      url.includes("/sign-in") ||
        url.includes("/sign-up") ||
        url.includes("/unauthorized")
    ).toBeTruthy();
  });

  test("interview session detail page redirects when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard/interviews/999");
    const url = page.url();
    expect(
      url.includes("/sign-in") ||
        url.includes("/sign-up") ||
        url.includes("/unauthorized")
    ).toBeTruthy();
  });
});

test.describe("Job Description Library UI", () => {
  test("job descriptions library page redirects when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard/job-descriptions");
    const url = page.url();
    expect(
      url.includes("/sign-in") ||
        url.includes("/sign-up") ||
        url.includes("/unauthorized")
    ).toBeTruthy();
  });
});
