import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
  usersTable,
  userGamificationTable,
  userBadgesTable,
  gamificationEventsTable,
} from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import { GAMIFICATION_BADGES } from "@/src/lib/gamification-badges";
import { getUserLevel } from "@/src/lib/gamification-levels";
import { getPracticeTimeAggregation } from "@/src/lib/practice-time";

const RECENT_EVENTS_LIMIT = 10;

/**
 * GET /api/gamification/status
 *
 * Returns the authenticated user's gamification status:
 * - points, currentStreak, highestStreak, lastActivityAt
 * - unlocked badges (with label + icon path)
 * - recent gamification events
 */
export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, "DEFAULT");
  if (!rl.success) return rl.response;

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [gamification, badges, recentEvents, practiceTime] = await Promise.all([
    db
      .select({
        points: userGamificationTable.points,
        currentStreak: userGamificationTable.currentStreak,
        highestStreak: userGamificationTable.highestStreak,
        lastActivityAt: userGamificationTable.lastActivityAt,
        updatedAt: userGamificationTable.updatedAt,
      })
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
        metadata: gamificationEventsTable.metadata,
        createdAt: gamificationEventsTable.createdAt,
      })
      .from(gamificationEventsTable)
      .where(eq(gamificationEventsTable.userId, user.id))
      .orderBy(desc(gamificationEventsTable.createdAt))
      .limit(RECENT_EVENTS_LIMIT),
    getPracticeTimeAggregation(user.id),
  ]);

  const badgeMap = new Map<string, { label: string; path: string }>(
    GAMIFICATION_BADGES.map((b) => [b.id, { label: b.label, path: b.path }])
  );

  const stats = gamification[0] ?? {
    points: 0,
    currentStreak: 0,
    highestStreak: 0,
    lastActivityAt: null,
    updatedAt: null,
  };

  const level = getUserLevel(stats.points);

  return NextResponse.json({
    points: stats.points,
    currentStreak: stats.currentStreak,
    highestStreak: stats.highestStreak,
    level: {
      level: level.level,
      title: level.title,
      progress: level.progress,
      pointsToNext: level.pointsToNext,
      nextLevelMin: level.nextLevelMin,
    },
    lastActivityAt: stats.lastActivityAt
      ? new Date(stats.lastActivityAt).toISOString()
      : null,
    updatedAt: stats.updatedAt
      ? new Date(stats.updatedAt).toISOString()
      : null,
    badges: badges.map((b) => {
      const meta = badgeMap.get(b.badgeId);
      return {
        id: b.badgeId,
        label: meta?.label ?? b.badgeId,
        iconPath: meta?.path ?? null,
        unlockedAt: b.unlockedAt instanceof Date
          ? b.unlockedAt.toISOString()
          : b.unlockedAt,
      };
    }),
    recentEvents: recentEvents.map((e) => ({
      eventType: e.eventType,
      points: e.points,
      metadata: e.metadata,
      createdAt: e.createdAt instanceof Date
        ? e.createdAt.toISOString()
        : e.createdAt,
    })),
    practiceTime: {
      totalMinutes: practiceTime.totalMinutes,
      thisWeekMinutes: practiceTime.thisWeekMinutes,
    },
  });
}
