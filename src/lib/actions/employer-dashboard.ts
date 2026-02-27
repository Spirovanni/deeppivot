"use server";

import { db } from "@/src/db";
import {
    usersTable,
    companiesTable,
    jobsTable,
    jobMarketplaceApplicationsTable,
    interviewSessionsTable,
    careerArchetypesTable,
} from "@/src/db/schema";
import { eq, and, gte, desc, count, avg, isNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

async function getDbUserId(): Promise<number> {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthenticated");

    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, userId))
        .limit(1);

    if (!user) throw new Error("User not found");
    return user.id;
}

export interface RecentApplicant {
    applicationId: number;
    jobTitle: string;
    status: string;
    appliedAt: Date;
    archetypeName: string | null;
    avgInterviewScore: number | null;
    applicantName: string;
}

export interface EmployerDashboardStats {
    activeJobs: number;
    totalApplicants: number;
    newThisWeek: number;
    company: { id: number; name: string; industry: string | null } | null;
    recentApplicants: RecentApplicant[];
}

export async function getEmployerDashboardStats(): Promise<EmployerDashboardStats> {
    const userId = await getDbUserId();

    // Find company owned by this user
    const [company] = await db
        .select({ id: companiesTable.id, name: companiesTable.name, industry: companiesTable.industry })
        .from(companiesTable)
        .where(eq(companiesTable.ownerUserId, userId))
        .limit(1);

    if (!company) {
        return { activeJobs: 0, totalApplicants: 0, newThisWeek: 0, company: null, recentApplicants: [] };
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [activeJobsData, totalAppsData, weeklyAppsData, recentApps] = await Promise.all([
        // Active jobs count
        db
            .select({ count: count() })
            .from(jobsTable)
            .where(and(eq(jobsTable.companyId, company.id), eq(jobsTable.status, "published"))),

        // Total applicants
        db
            .select({ count: count() })
            .from(jobMarketplaceApplicationsTable)
            .innerJoin(jobsTable, eq(jobsTable.id, jobMarketplaceApplicationsTable.jobId))
            .where(eq(jobsTable.companyId, company.id)),

        // New this week
        db
            .select({ count: count() })
            .from(jobMarketplaceApplicationsTable)
            .innerJoin(jobsTable, eq(jobsTable.id, jobMarketplaceApplicationsTable.jobId))
            .where(
                and(
                    eq(jobsTable.companyId, company.id),
                    gte(jobMarketplaceApplicationsTable.createdAt, oneWeekAgo),
                )
            ),

        // Recent applicants with archetype + avg interview score
        db
            .select({
                applicationId: jobMarketplaceApplicationsTable.id,
                jobTitle: jobsTable.title,
                status: jobMarketplaceApplicationsTable.status,
                appliedAt: jobMarketplaceApplicationsTable.createdAt,
                archetypeName: careerArchetypesTable.archetypeName,
                applicantUserId: jobMarketplaceApplicationsTable.userId,
                applicantName: usersTable.name,
            })
            .from(jobMarketplaceApplicationsTable)
            .innerJoin(jobsTable, eq(jobsTable.id, jobMarketplaceApplicationsTable.jobId))
            .innerJoin(usersTable, eq(usersTable.id, jobMarketplaceApplicationsTable.userId))
            .leftJoin(careerArchetypesTable, eq(careerArchetypesTable.userId, jobMarketplaceApplicationsTable.userId))
            .where(eq(jobsTable.companyId, company.id))
            .orderBy(desc(jobMarketplaceApplicationsTable.createdAt))
            .limit(5),
    ]);

    // Batch fetch avg scores for each applicant
    const applicantUserIds = [...new Set(recentApps.map((a) => a.applicantUserId))];

    const scoreMap: Record<number, number | null> = {};
    if (applicantUserIds.length > 0) {
        for (const uid of applicantUserIds) {
            const [scoreRow] = await db
                .select({ avg: avg(interviewSessionsTable.overallScore) })
                .from(interviewSessionsTable)
                .where(and(eq(interviewSessionsTable.userId, uid), isNull(interviewSessionsTable.deletedAt)))
                .limit(1);
            const raw = scoreRow?.avg;
            scoreMap[uid] = raw != null ? Math.round(Number(raw)) : null;
        }
    }

    return {
        activeJobs: activeJobsData[0]?.count ?? 0,
        totalApplicants: totalAppsData[0]?.count ?? 0,
        newThisWeek: weeklyAppsData[0]?.count ?? 0,
        company,
        recentApplicants: recentApps.map((a) => ({
            applicationId: a.applicationId,
            jobTitle: a.jobTitle,
            status: a.status,
            appliedAt: a.appliedAt,
            archetypeName: a.archetypeName ?? null,
            applicantName: a.applicantName,
            avgInterviewScore: scoreMap[a.applicantUserId] ?? null,
        })),
    };
}
