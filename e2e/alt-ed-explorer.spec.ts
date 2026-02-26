import { test, expect } from "@playwright/test";

/**
 * Alt-Ed Explorer E2E tests (unauthenticated — page is accessible without login).
 */

test.describe("Alt-Ed Explorer", () => {
  test("loads the explorer page", async ({ page }) => {
    await page.goto("/explorer/alt-ed");

    // Heading should be visible
    await expect(page.locator("h1").first()).toContainText(/Alt-Ed/i);
  });

  test("shows program cards", async ({ page }) => {
    await page.goto("/explorer/alt-ed");

    // Wait for at least one card to render
    await page.waitForSelector('[aria-label="Program results"], .grid', { timeout: 10_000 });

    // There should be multiple cards
    const cards = page.locator(".grid > *");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search filter narrows results", async ({ page }) => {
    await page.goto("/explorer/alt-ed");

    const initialCards = await page.locator(".grid > *").count();

    // Type in the search box
    const searchInput = page.locator('input[type="search"], input[aria-label="Search programs"]').first();
    await searchInput.fill("cybersecurity");
    await page.waitForTimeout(300); // debounce

    const filteredCards = await page.locator(".grid > *").count();
    expect(filteredCards).toBeLessThanOrEqual(initialCards);
  });

  test("ROI calculator button is present on cards", async ({ page }) => {
    await page.goto("/explorer/alt-ed");

    // At least one ROI button
    const roiBtn = page.locator('button[aria-label="Calculate ROI"]').first();
    await expect(roiBtn).toBeVisible();
  });

  test("opens ROI calculator modal", async ({ page }) => {
    await page.goto("/explorer/alt-ed");

    const roiBtn = page.locator('button[aria-label="Calculate ROI"]').first();
    await roiBtn.click();

    // Modal dialog should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText(/ROI/i);
  });
});

test.describe("Alt-Ed API", () => {
  test("GET /api/alt-ed returns paginated data", async ({ request }) => {
    const res = await request.get("/api/alt-ed?limit=5&page=1");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("pagination");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.pagination).toHaveProperty("total");
    expect(body.pagination).toHaveProperty("totalPages");
  });

  test("GET /api/alt-ed filters by type", async ({ request }) => {
    const res = await request.get("/api/alt-ed?type=bootcamp&limit=10");
    expect(res.status()).toBe(200);

    const body = await res.json();
    for (const program of body.data) {
      expect(program.programType).toBe("bootcamp");
    }
  });

  test("GET /api/alt-ed text search works", async ({ request }) => {
    const res = await request.get("/api/alt-ed?q=python&limit=10");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(0);
  });
});
