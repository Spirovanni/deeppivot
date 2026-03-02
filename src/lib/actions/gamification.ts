"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
    usersTable,
    userGamificationTable,
    userBadgesTable,
    gamificationEventsTable,
} from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { GAMIFICATION_BADGES } from "@/src/lib/gamification-badges";

const RECENT_EVENTS_LIMIT = 5;

export type GamificationStatus = {
    points: number;
    currentStreak: number;
    highestStreak: number;
    lastActivityAt: string | null;
    badges: Array<{
        id: string;
        label: string;
        iconPath: string | null;
        unlockedAt: string;
    }>;
    recentEvents: Array<{
        eventType: string;
        points: number;
        createdAt: string;
    }>;
};

/**
 * Server action to fetch the current user's gamification status.
 * Replicates the logic from /api/gamification/status for RSC use.
 */
export async function getGamificationStatus(): Promise<GamificationStatus | null> {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    try {
        const [user] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkId))
            .limit(1);

        if (!user) return null;

        const [gamification, badges, recentEvents] = await Promise.all([
            db
                .select()
                .from(userGamificationTable)
                .where(eq(userGamificationTable.userId, user.id))
                .limit(1),
            db
                .select({
                    badgeId: userBadgesTable.badgeId,
                    unlockedAt: userBadgesTable.unlockedAt,
                })
                .from(userBadgesTable)
                .where(eq(userBadgesTable.userId, user.id)),
            db
                .select({
                    eventType: gamificationEventsTable.eventType,
                    points: gamificationEventsTable.points,
                    createdAt: gamificationEventsTable.createdAt,
                })
                .from(gamificationEventsTable)
                .where(eq(gamificationEventsTable.userId, user.id))
                .orderBy(desc(gamificationEventsTable.createdAt))
                .limit(RECENT_EVENTS_LIMIT),
        ]);

        const stats = gamification[0] ?? {
            points: 0,
            currentStreak: 0,
            highestStreak: 0,
            lastActivityAt: null,
        };

        const badgeMap = new Map<string, { label: string; path: string }>(
            GAMIFICATION_BADGES.map((b) => [b.id, { label: b.label, path: b.path }])
        );

        return {
            points: stats.points,
            currentStreak: stats.currentStreak,
            highestStreak: stats.highestStreak,
            lastActivityAt: stats.lastActivityAt ? stats.lastActivityAt.toISOString() : null,
            badges: badges.map((b) => {
                const meta = badgeMap.get(b.badgeId);
                return {
                    id: b.badgeId,
                    label: meta?.label ?? b.badgeId,
                    iconPath: meta?.path ?? null,
                    unlockedAt: b.unlockedAt.toISOString(),
                };
            }),
            recentEvents: recentEvents.map((e) => ({
                eventType: e.eventType,
                points: e.points,
                createdAt: e.createdAt.toISOString(),
            })),
        };
    } catch (err) {
        console.error("[gamification] getGamificationStatus action failed:", err);
        return null;
    }
}
