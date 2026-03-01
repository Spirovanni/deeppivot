import { expect, test } from "@playwright/test";

/**
 * Resume Parsing & Cover Letter Generation — E2E QA (deeppivot-238)
 * 
 * Verifies public accessibility, auth-gate redirects, and UI structure
 * for the resume and cover letter feature areas.
 */

test.describe("Resume Management UI", () => {
    test("redirects unauthenticated users from resume practice page", async ({ page }) => {
        await page.goto("/dashboard/practice/resumes");
        // Should be redirected to sign-in
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test("API: GET /api/resumes requires auth", async ({ request }) => {
        const res = await request.get("/api/resumes");
        expect(res.status()).toBe(401);
    });

    test("API: POST /api/resumes/upload requires auth", async ({ request }) => {
        const res = await request.post("/api/resumes/upload", {
            data: { file: "dummy" },
        });
        expect(res.status()).toBe(401);
    });
});

test.describe("Cover Letter UI", () => {
    test("redirects unauthenticated users from cover letter generator", async ({ page }) => {
        await page.goto("/dashboard/practice/cover-letter");
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test("redirects unauthenticated users from cover letter history", async ({ page }) => {
        await page.goto("/dashboard/practice/cover-letter/history");
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test("API: POST /api/cover-letters/generate requires auth", async ({ request }) => {
        const res = await request.post("/api/cover-letters/generate", {
            data: { resumeId: 1, jobDescriptionId: 1 },
        });
        expect(res.status()).toBe(401);
    });

    test("API: POST /api/cover-letters/iterate requires auth", async ({ request }) => {
        const res = await request.post("/api/cover-letters/iterate", {
            data: { coverLetterId: 1, sectionIndex: 0, instruction: "make it better" },
        });
        expect(res.status()).toBe(401);
    });
});
