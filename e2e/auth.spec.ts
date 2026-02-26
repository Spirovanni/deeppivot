import { test, expect } from "@playwright/test";

/**
 * Authentication flow E2E tests.
 *
 * These tests verify the auth UI renders correctly and basic
 * navigation works. Full sign-in/sign-up tests require Clerk test
 * credentials and are skipped unless PLAYWRIGHT_TEST_EMAIL is set.
 */

test.describe("Sign-in page", () => {
  test("renders the sign-in form", async ({ page }) => {
    await page.goto("/sign-in");

    // Email input should be visible
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();

    // Password input should be visible
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    // Sign in button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows Google sign-in button", async ({ page }) => {
    await page.goto("/sign-in");

    const googleBtn = page.locator("button:has-text('Google'), button:has-text('Continue with Google')").first();
    await expect(googleBtn).toBeVisible();
  });

  test("shows a link to sign up", async ({ page }) => {
    await page.goto("/sign-in");

    const signUpLink = page.locator('a[href*="sign-up"]').first();
    await expect(signUpLink).toBeVisible();
  });

  test("shows validation error on empty submit", async ({ page }) => {
    await page.goto("/sign-in");

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // HTML5 validation or custom error should appear
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const isInvalid = await emailInput.evaluate((el) =>
      (el as HTMLInputElement).validity.valueMissing
    );
    expect(isInvalid).toBe(true);
  });
});

test.describe("Sign-up page", () => {
  test("renders the sign-up form", async ({ page }) => {
    await page.goto("/sign-up");

    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows Google sign-up button", async ({ page }) => {
    await page.goto("/sign-up");

    const googleBtn = page.locator("button:has-text('Google'), button:has-text('Continue with Google')").first();
    await expect(googleBtn).toBeVisible();
  });

  test("has a link back to sign in", async ({ page }) => {
    await page.goto("/sign-up");

    const signInLink = page.locator('a[href*="sign-in"]').first();
    await expect(signInLink).toBeVisible();
  });
});

test.describe("Protected routes", () => {
  test("redirects unauthenticated users from /dashboard to /sign-in", async ({ page }) => {
    await page.goto("/dashboard");

    // Should be redirected to sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("redirects unauthenticated users from /dashboard/interviews", async ({ page }) => {
    await page.goto("/dashboard/interviews");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
