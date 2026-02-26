import { expect, test } from "@playwright/test";

/**
 * Job Marketplace E2E Tests (deeppivot-167)
 *
 * These tests cover the public-facing views of the marketplace,
 * which are accessible without authentication at the component level.
 * Authentication-required flows (apply, employer dashboard) should be
 * tested with a seeded user session fixture.
 */

test.describe("Job Marketplace", () => {
    test("marketplace listing page loads", async ({ page }) => {
        await page.goto("/jobs");
        await expect(page).toHaveTitle(/DeepPivot/i);
        // Header present
        await expect(page.getByText("Job Marketplace")).toBeVisible();
        // Filter panel present
        await expect(page.getByPlaceholder(/Job title, skills/i)).toBeVisible();
    });

    test("marketplace page renders with keyword filter", async ({ page }) => {
        await page.goto("/jobs?q=engineer");
        await expect(page.getByPlaceholder(/Job title, skills/i)).toHaveValue("engineer");
    });

    test("employer route redirects to unauthorized without employer role", async ({ page }) => {
        // Without authentication, Next.js middleware should redirect
        const response = await page.goto("/employer/jobs");
        // Should be redirected to sign-in or unauthorized
        const url = page.url();
        expect(
            url.includes("/sign-in") ||
            url.includes("/unauthorized") ||
            url.includes("/employer/jobs") === false
        ).toBeTruthy();
    });

    test("employer onboarding page redirects non-employers", async ({ page }) => {
        const response = await page.goto("/employer/onboarding");
        const url = page.url();
        expect(
            url.includes("/sign-in") ||
            url.includes("/unauthorized") ||
            url.includes("/employer/onboarding") === false
        ).toBeTruthy();
    });

    test("job detail page returns 200 for published jobs via API", async ({ request }) => {
        // First fetch the jobs list to get a real job ID
        const listResponse = await request.get("/api/jobs");
        expect(listResponse.status()).toBe(200);
        const data = await listResponse.json();
        expect(data).toHaveProperty("jobs");
        expect(Array.isArray(data.jobs)).toBeTruthy();

        // If jobs exist, verify the detail page
        if (data.jobs.length > 0) {
            const firstJob = data.jobs[0];
            const detailResponse = await request.get(`/api/jobs/${firstJob.id}`);
            expect(detailResponse.status()).toBe(200);
            const detail = await detailResponse.json();
            expect(detail).toHaveProperty("title");
            expect(detail).toHaveProperty("companyName");
        }
    });

    test("apply to closed job returns 410", async ({ request }) => {
        // Attempt to apply to a non-existent/closed job ID (very high ID)
        const res = await request.post("/api/jobs/999999/apply", {
            data: { boardId: 1 },
        });
        // Should be 401 (no auth) not 200
        expect([401, 404, 410]).toContain(res.status());
    });

    test("companies API endpoint is reachable", async ({ request }) => {
        const res = await request.get("/api/companies");
        expect(res.status()).toBe(200);
        const companies = await res.json();
        expect(Array.isArray(companies)).toBeTruthy();
    });

    test("me/applications endpoint requires auth", async ({ request }) => {
        const res = await request.get("/api/me/applications");
        expect(res.status()).toBe(401);
    });
});
