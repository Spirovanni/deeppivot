"use server";

import { db } from "@/src/db";
import {
    usersTable,
    careerArchetypesTable,
    interviewSessionsTable,
    userResumesTable,
    companiesTable,
    jobMatchesTable,
    jobsTable,
    jobMarketplaceApplicationsTable,
} from "@/src/db/schema";
import { eq, and, isNull, desc, avg, ne } from "drizzle-orm";
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

export interface MatchedCandidate {
    id: number;
    name: string;
    avatarUrl: string | null;
    archetypeName: string | null;
    avgInterviewScore: number | null;
    skills: string[];
}

export interface RecommendedJobMatch {
    matchId: number;
    jobId: number;
    matchScore: number;
    title: string;
    companyName: string;
    location: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    remoteFlag: boolean;
}

/**
 * Fetch top candidate matches for employers.
 * Strictly enforces privacy: only users with openToOpportunities = true are returned.
 */
export async function getTopCandidateMatches(): Promise<MatchedCandidate[]> {
    const userId = await getDbUserId();

    // 1. Verify caller is an employer (owns a company)
    const [company] = await db
        .select({ id: companiesTable.id })
        .from(companiesTable)
        .where(eq(companiesTable.ownerUserId, userId))
        .limit(1);

    if (!company) {
        throw new Error("Only employers can access candidate discovery.");
    }

    // 2. Fetch candidates who have opted-in (openToOpportunities = true)
    // Exclude deleted users and only include role='user'
    const candidates = await db
        .select({
            id: usersTable.id,
            name: usersTable.name,
            avatarUrl: usersTable.avatarUrl,
            archetypeName: careerArchetypesTable.archetypeName,
        })
        .from(usersTable)
        .leftJoin(careerArchetypesTable, eq(careerArchetypesTable.userId, usersTable.id))
        .where(
            and(
                eq(usersTable.role, "user"),
                eq(usersTable.openToOpportunities, true),
                isNull(usersTable.deletedAt)
            )
        )
        .orderBy(desc(usersTable.createdAt))
        .limit(10);

    const results: MatchedCandidate[] = [];

    for (const c of candidates) {
        // Fetch avg interview score
        const [scoreRow] = await db
            .select({ avg: avg(interviewSessionsTable.overallScore) })
            .from(interviewSessionsTable)
            .where(and(eq(interviewSessionsTable.userId, c.id), isNull(interviewSessionsTable.deletedAt)))
            .limit(1);

        const avgScore = scoreRow?.avg != null ? Math.round(Number(scoreRow.avg)) : null;

        // Fetch skills from latest parsed resume
        const [resume] = await db
            .select({ parsedData: userResumesTable.parsedData })
            .from(userResumesTable)
            .where(eq(userResumesTable.userId, c.id))
            .orderBy(desc(userResumesTable.createdAt))
            .limit(1);

        const skills = (resume?.parsedData as any)?.skills || [];

        results.push({
            id: c.id,
            name: c.name,
            avatarUrl: c.avatarUrl ?? null,
            archetypeName: c.archetypeName || null,
            avgInterviewScore: avgScore,
            skills: skills.slice(0, 5),
        });
    }

    return results;
}

/**
 * Candidate-side recommended jobs from precomputed `job_matches`.
 */
export async function getRecommendedJobsForCandidate(limit = 6): Promise<RecommendedJobMatch[]> {
    const userId = await getDbUserId();

    const rows = await db
        .select({
            matchId: jobMatchesTable.id,
            jobId: jobMatchesTable.jobId,
            matchScore: jobMatchesTable.matchScore,
            title: jobsTable.title,
            companyName: companiesTable.name,
            location: jobsTable.location,
            salaryMin: jobsTable.salaryMin,
            salaryMax: jobsTable.salaryMax,
            remoteFlag: jobsTable.remoteFlag,
            applicationId: jobMarketplaceApplicationsTable.id,
        })
        .from(jobMatchesTable)
        .innerJoin(jobsTable, eq(jobMatchesTable.jobId, jobsTable.id))
        .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
        .leftJoin(
            jobMarketplaceApplicationsTable,
            and(
                eq(jobMarketplaceApplicationsTable.jobId, jobsTable.id),
                eq(jobMarketplaceApplicationsTable.userId, userId)
            )
        )
        .where(
            and(
                eq(jobMatchesTable.userId, userId),
                eq(jobsTable.status, "published"),
                ne(jobMatchesTable.status, "dismissed"),
                ne(jobMatchesTable.status, "applied")
            )
        )
        .orderBy(desc(jobMatchesTable.matchScore), desc(jobMatchesTable.updatedAt))
        .limit(limit * 2);

    return rows
        .filter((row) => row.applicationId == null)
        .slice(0, limit)
        .map((row) => ({
            matchId: row.matchId,
            jobId: row.jobId,
            matchScore: row.matchScore,
            title: row.title,
            companyName: row.companyName,
            location: row.location,
            salaryMin: row.salaryMin,
            salaryMax: row.salaryMax,
            remoteFlag: row.remoteFlag,
        }));
}
