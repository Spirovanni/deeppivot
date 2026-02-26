import { test, expect } from "@playwright/test";

/**
 * Landing page smoke tests — verify the public-facing page loads and
 * key elements are present without requiring authentication.
 */

test.describe("Landing page", () => {
  test("loads and shows hero heading", async ({ page }) => {
    await page.goto("/");

    // Page should load without error
    await expect(page).not.toHaveTitle(/Error|404|500/i);

    // Hero section with an H1 should be present
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
  });

  test("has a link to sign up", async ({ page }) => {
    await page.goto("/");

    // There should be at least one link/button pointing to /sign-up
    const signUpLink = page.locator('a[href="/sign-up"], a[href*="sign-up"]').first();
    await expect(signUpLink).toBeVisible();
  });

  test("has a link to sign in", async ({ page }) => {
    await page.goto("/");

    const signInLink = page.locator('a[href="/sign-in"], a[href*="sign-in"]').first();
    await expect(signInLink).toBeVisible();
  });

  test("navigates to sign-in page", async ({ page }) => {
    await page.goto("/");

    const signInLink = page.locator('a[href="/sign-in"]').first();
    await signInLink.click();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
