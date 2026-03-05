/**
 * Exports QA: admin and employer export endpoints require auth (deeppivot-322)
 */

import { expect, test } from "@playwright/test";

test.describe("Admin Export Endpoints", () => {
  test("GET /api/admin/export/users returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/admin/export/users");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/export/sessions returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/admin/export/sessions");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/export/jobs returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/admin/export/jobs");
    expect(res.status()).toBe(401);
  });

  test("POST /api/admin/export/users/link returns 401 without auth", async ({ request }) => {
    const res = await request.post("/api/admin/export/users/link", {
      data: { includeDeleted: false },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/admin/export/sessions/link returns 401 without auth", async ({ request }) => {
    const res = await request.post("/api/admin/export/sessions/link", {
      data: {},
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/admin/export/jobs/link returns 401 without auth", async ({ request }) => {
    const res = await request.post("/api/admin/export/jobs/link", {
      data: {},
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Employer Export Endpoints", () => {
  test("GET /api/employer/jobs/1/applications/export returns 401 without auth", async ({ request }) => {
    const res = await request.get("/api/employer/jobs/1/applications/export");
    expect([401, 403, 404]).toContain(res.status());
  });
});

test.describe("Export Download (signed token)", () => {
  test("GET /api/admin/export/download without token returns 400", async ({ request }) => {
    const res = await request.get("/api/admin/export/download");
    expect(res.status()).toBe(400);
  });

  test("GET /api/admin/export/download with invalid token returns 403", async ({ request }) => {
    const res = await request.get("/api/admin/export/download?token=invalid");
    expect(res.status()).toBe(403);
  });
});
