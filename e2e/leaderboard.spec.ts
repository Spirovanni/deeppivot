import { test, expect } from "@playwright/test";

test.describe("Leaderboard Feature", () => {
    test("Leaderboard page should be accessible", async ({ page }) => {
        // This assumes the user is logged in or we have a way to bypass/mock auth
        // In many of these setups, we have a global setup for auth.
        await page.goto("/dashboard/leaderboard");

        // Check for main heading
        await expect(page.getByRole("heading", { name: /Leaderboard/i })).toBeVisible();

        // Check for rankings card
        await expect(page.getByText(/Rankings/i)).toBeVisible();
    });

    test("Leaderboard API should return 401 if not authenticated", async ({ request }) => {
        const response = await request.get("/api/leaderboard");
        expect(response.status()).toBe(401);
    });

    test("Profile settings should have leaderboard privacy toggle", async ({ page }) => {
        await page.goto("/dashboard/settings/profile");

        await expect(page.getByText(/Leaderboard privacy/i)).toBeVisible();
        await expect(page.getByLabel(/Show on Leaderboard/i)).toBeVisible();
    });
});
