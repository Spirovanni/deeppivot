import { inngest } from "./client";
import { db } from "@/src/db";
import {
    userGamificationTable,
    userBadgesTable,
    interviewSessionsTable,
    careerMilestonesTable,
    jobApplicationsTable,
    notificationsTable,
} from "@/src/db/schema";
import { eq, and, count, max, isNotNull } from "drizzle-orm";
import { BADGE_RULES, UserStats } from "@/src/lib/badge-rules";

export const evaluateBadges = inngest.createFunction(
    { id: "evaluate-badges", name: "Evaluate Achievement Badges" },
    { event: "gamification/points.added" },
    async ({ event, step }) => {
        const { userId } = event.data;

        // 1. Gather User Stats
        const stats = await step.run("fetch-user-stats", async () => {
            const [gamification] = await db
                .select()
                .from(userGamificationTable)
                .where(eq(userGamificationTable.userId, userId))
                .limit(1);

            const [interviews] = await db
                .select({
                    count: count(),
                    maxScore: max(interviewSessionsTable.overallScore),
                })
                .from(interviewSessionsTable)
                .where(
                    and(
                        eq(interviewSessionsTable.userId, userId),
                        eq(interviewSessionsTable.status, "completed")
                    )
                );

            const [completedMilestones] = await db
                .select({ count: count() })
                .from(careerMilestonesTable)
                .where(
                    and(
                        eq(careerMilestonesTable.userId, userId),
                        eq(careerMilestonesTable.status, "completed")
                    )
                );

            const [createdMilestones] = await db
                .select({ count: count() })
                .from(careerMilestonesTable)
                .where(eq(careerMilestonesTable.userId, userId));

            const [jobApplications] = await db
                .select({ count: count() })
                .from(jobApplicationsTable)
                .where(eq(jobApplicationsTable.userId, userId));

            const unlockedBadges = await db
                .select({ badgeId: userBadgesTable.badgeId })
                .from(userBadgesTable)
                .where(eq(userBadgesTable.userId, userId));

            const userStats: UserStats = {
                totalPoints: gamification?.points ?? 0,
                currentStreak: gamification?.currentStreak ?? 0,
                highestStreak: gamification?.highestStreak ?? 0,
                completedInterviewsCount: Number(interviews?.count ?? 0),
                bestInterviewScore: interviews?.maxScore ?? 0,
                completedMilestonesCount: Number(completedMilestones?.count ?? 0),
                createdMilestonesCount: Number(createdMilestones?.count ?? 0),
                jobApplicationsCount: Number(jobApplications?.count ?? 0),
                unlockedBadgeIds: unlockedBadges.map((b) => b.badgeId),
            };

            return userStats;
        });

        // 2. Evaluate rules
        const newBadges = BADGE_RULES.filter(
            (rule) => !stats.unlockedBadgeIds.includes(rule.id) && rule.evaluate(stats)
        );

        if (newBadges.length === 0) return { message: "No new badges unlocked." };

        // 3. Unlock badges and notify
        await step.run("unlock-badges", async () => {
            for (const badge of newBadges) {
                // Insert into database
                await db
                    .insert(userBadgesTable)
                    .values({
                        userId,
                        badgeId: badge.id,
                    })
                    .onConflictDoNothing();

                // Create notification
                await db.insert(notificationsTable).values({
                    userId,
                    title: "New Achievement Unlocked!",
                    body: `Congratulations! You've earned the "${badge.id}" badge: ${badge.description}`,
                    type: "system",
                    link: "/dashboard/gamification",
                });
            }
        });

        return {
            message: `Unlocked ${newBadges.length} new badges: ${newBadges
                .map((b) => b.id)
                .join(", ")}`,
        };
    }
);
