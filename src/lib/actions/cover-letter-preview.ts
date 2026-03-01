"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
    usersTable,
    jobApplicationsTable,
    jobMarketplaceApplicationsTable,
    jobDescriptionsTable,
    coverLettersTable,
} from "@/src/db/schema";
import { eq, and, desc, ilike } from "drizzle-orm";

/**
 * Get cover letter content for a job application card in the Kanban board.
 * Sources: (1) marketplace application cover letter, (2) AI-generated cover letter
 * matched by job description (position + company).
 */
export async function getCoverLetterForJobApplication(
    jobApplicationId: number
): Promise<{ content: string | null; source: "marketplace" | "jd" | null }> {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { content: null, source: null };

    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId))
        .limit(1);
    if (!user) return { content: null, source: null };

    const [job] = await db
        .select({
            id: jobApplicationsTable.id,
            position: jobApplicationsTable.position,
            company: jobApplicationsTable.company,
            marketplaceApplicationId: jobApplicationsTable.marketplaceApplicationId,
            coverLetterId: jobApplicationsTable.coverLetterId,
            jobDescriptionId: jobApplicationsTable.jobDescriptionId,
        })
        .from(jobApplicationsTable)
        .where(
            and(
                eq(jobApplicationsTable.id, jobApplicationId),
                eq(jobApplicationsTable.userId, user.id)
            )
        )
        .limit(1);

    if (!job) return { content: null, source: null };

    // 1. Direct link: cover letter FK on job application (deeppivot-235)
    if (job.coverLetterId) {
        const [cl] = await db
            .select({ content: coverLettersTable.content })
            .from(coverLettersTable)
            .where(
                and(
                    eq(coverLettersTable.id, job.coverLetterId),
                    eq(coverLettersTable.userId, user.id)
                )
            )
            .limit(1);
        if (cl?.content) return { content: cl.content, source: "jd" };
    }

    // 2. JD link: get cover letter for linked job description
    if (job.jobDescriptionId) {
        const [cl] = await db
            .select({ content: coverLettersTable.content })
            .from(coverLettersTable)
            .where(
                and(
                    eq(coverLettersTable.jobDescriptionId, job.jobDescriptionId),
                    eq(coverLettersTable.userId, user.id)
                )
            )
            .orderBy(desc(coverLettersTable.createdAt))
            .limit(1);
        if (cl?.content) return { content: cl.content, source: "jd" };
    }

    // 3. Marketplace: get cover letter from job_marketplace_applications
    if (job.marketplaceApplicationId) {
        const [mktApp] = await db
            .select({ coverLetter: jobMarketplaceApplicationsTable.coverLetter })
            .from(jobMarketplaceApplicationsTable)
            .where(
                and(
                    eq(jobMarketplaceApplicationsTable.id, job.marketplaceApplicationId),
                    eq(jobMarketplaceApplicationsTable.userId, user.id)
                )
            )
            .limit(1);

        if (mktApp?.coverLetter) {
            return { content: mktApp.coverLetter, source: "marketplace" };
        }
    }

    // 4. Fallback: match job_description by position (+ company) — fuzzy
    const positionTrim = job.position.trim();
    if (!positionTrim) return { content: null, source: null };

    const jdConditions = [
        eq(jobDescriptionsTable.userId, user.id),
        ilike(jobDescriptionsTable.title, positionTrim),
    ];
    if (job.company?.trim()) {
        jdConditions.push(ilike(jobDescriptionsTable.company, job.company.trim()));
    }

    const [jd] = await db
        .select({ id: jobDescriptionsTable.id })
        .from(jobDescriptionsTable)
        .where(and(...jdConditions))
        .limit(1);

    if (!jd) return { content: null, source: null };

    const [cl] = await db
        .select({ content: coverLettersTable.content })
        .from(coverLettersTable)
        .where(
            and(
                eq(coverLettersTable.jobDescriptionId, jd.id),
                eq(coverLettersTable.userId, user.id)
            )
        )
        .orderBy(desc(coverLettersTable.createdAt))
        .limit(1);

    if (cl?.content) {
        return { content: cl.content, source: "jd" };
    }

    return { content: null, source: null };
}

/**
 * Link a cover letter to a Job Tracker application (deeppivot-235).
 * Verifies ownership of both resources.
 */
export async function linkCoverLetterToJobApplication(
    jobApplicationId: number,
    coverLetterId: number
): Promise<{ success: boolean; error?: string }> {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId))
        .limit(1);
    if (!user) return { success: false, error: "User not found" };

    const [cl] = await db
        .select({ id: coverLettersTable.id, jobDescriptionId: coverLettersTable.jobDescriptionId })
        .from(coverLettersTable)
        .where(
            and(
                eq(coverLettersTable.id, coverLetterId),
                eq(coverLettersTable.userId, user.id)
            )
        )
        .limit(1);
    if (!cl) return { success: false, error: "Cover letter not found" };

    const [updated] = await db
        .update(jobApplicationsTable)
        .set({
            coverLetterId: cl.id,
            jobDescriptionId: cl.jobDescriptionId,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(jobApplicationsTable.id, jobApplicationId),
                eq(jobApplicationsTable.userId, user.id)
            )
        )
        .returning({ id: jobApplicationsTable.id });

    return updated ? { success: true } : { success: false, error: "Job application not found" };
}

/**
 * List cover letters that could be linked to an application (same user, optionally matching position).
 * Used by the "Link cover letter" UI.
 */
export async function getLinkableCoverLettersForApplication(
    jobApplicationId: number
): Promise<{ id: number; positionTitle: string; companyName: string | null; createdAt: Date }[]> {
    const { userId: clerkId } = await auth();
    if (!clerkId) return [];

    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId))
        .limit(1);
    if (!user) return [];

    const rows = await db
        .select({
            id: coverLettersTable.id,
            positionTitle: jobDescriptionsTable.title,
            companyName: jobDescriptionsTable.company,
            createdAt: coverLettersTable.createdAt,
        })
        .from(coverLettersTable)
        .innerJoin(jobDescriptionsTable, eq(coverLettersTable.jobDescriptionId, jobDescriptionsTable.id))
        .where(eq(coverLettersTable.userId, user.id))
        .orderBy(desc(coverLettersTable.createdAt))
        .limit(20);

    return rows.map((r) => ({
        id: r.id,
        positionTitle: r.positionTitle ?? "",
        companyName: r.companyName ?? null,
        createdAt: r.createdAt,
    }));
}
