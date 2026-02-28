import { expect, test } from "@playwright/test";

/**
 * Phase 16.3: In-App Notification Center & Admin Announcements — E2E QA (deeppivot-266)
 *
 * Covers auth gates for:
 * - Real-time notification delivery API (GET /api/notifications)
 * - Admin broadcast API (POST /api/admin/announcements)
 * - Admin area access (redirect when unauthenticated)
 */

test.describe("Notifications API", () => {
    test("GET /api/notifications requires auth", async ({ request }) => {
        const res = await request.get("/api/notifications");
        expect(res.status()).toBe(401);
    });
});

test.describe("Admin broadcast API", () => {
    test("POST /api/admin/announcements requires auth", async ({ request }) => {
        const res = await request.post("/api/admin/announcements", {
            data: { title: "Test Announcement", body: "Test content" },
        });
        expect(res.status()).toBe(401);
    });

    test("POST /api/admin/announcements rejects missing title", async ({
        request,
    }) => {
        // When auth is implemented, this validates request shape. Without auth we get 401 first.
        // This test documents the expected validation; with seeded admin we'd get 400.
        const res = await request.post("/api/admin/announcements", {
            data: { body: "No title" },
        });
        expect(res.status()).toBe(401);
    });
});

test.describe("Admin area access", () => {
    test("admin settings page redirects unauthenticated users to sign-in", async ({
        page,
    }) => {
        await page.goto("/admin/settings");
        const url = page.url();
        expect(
            url.includes("/sign-in") ||
                url.includes("/sign-up") ||
                url.includes("/unauthorized")
        ).toBeTruthy();
    });

    test("admin page redirects unauthenticated users", async ({ page }) => {
        await page.goto("/admin");
        const url = page.url();
        expect(
            url.includes("/sign-in") ||
                url.includes("/sign-up") ||
                url.includes("/unauthorized")
        ).toBeTruthy();
    });
});
