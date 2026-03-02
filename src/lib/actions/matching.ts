"use server";

import { db } from "@/src/db";
import {
    usersTable,
    careerArchetypesTable,
    interviewSessionsTable,
    userResumesTable,
    companiesTable,
} from "@/src/db/schema";
import { eq, and, isNull, desc, avg } from "drizzle-orm";
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
