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

    // 1. Marketplace: get cover letter from job_marketplace_applications
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

    // 2. External: match job_description by position (+ company if present)
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
