import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Trophy, Sparkles, Flame, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGamificationStatus } from "@/src/lib/actions/gamification";
import { getUserLevel, MAX_LEVEL } from "@/src/lib/gamification-levels";
import { GAMIFICATION_BADGES } from "@/src/lib/gamification-badges";
import { AchievementsBadgeGrid } from "@/components/gamification/AchievementsBadgeGrid";
import { ShareToLinkedInButton } from "@/components/gamification/ShareToLinkedInButton";
import Link from "next/link";

export default async function AchievementsPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const status = await getGamificationStatus();
    const gamificationEnabled = status?.enabled ?? true;

    const points = status?.points ?? 0;
    if (!gamificationEnabled) {
        return (
            <div className="p-6 md:p-8">
                <div className="mx-auto max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Gamification is turned off</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                You have disabled gamification features in profile settings. Re-enable it to view achievements, points, and streak progress.
                            </p>
                            <Link
                                href="/dashboard/settings/profile"
                                className="inline-flex text-sm font-medium text-primary hover:underline"
                            >
                                Go to Profile Settings →
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const streak = status?.currentStreak ?? 0;
    const highestStreak = status?.highestStreak ?? 0;
    const badges = status?.badges ?? [];
    const userLevel = getUserLevel(points);

    const unlockedCount = badges.length;
    const totalCount = GAMIFICATION_BADGES.length;

    return (
        <div className="p-6 md:p-8">
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
                            <Trophy className="size-7 text-amber-500" />
                            Achievements
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Track your progress and unlock badges as you level up your career journey.
                        </p>
                    </div>
                    {unlockedCount > 0 && (
                        <ShareToLinkedInButton variant="outline" size="sm" />
                    )}
                </div>

                {/* Stats Row */}
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10">
                                <Sparkles className="size-5 text-primary" />
                            </div>
                            <span className="text-2xl font-bold text-primary">{points}</span>
                            <span className="text-xs text-muted-foreground">Total Points</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10">
                                <span className="text-sm font-bold text-primary">Lv.{userLevel.level}</span>
                            </div>
                            <span className="text-2xl font-bold">{userLevel.title}</span>
                            <span className="text-xs text-muted-foreground">
                                {userLevel.nextLevelMin ? `${userLevel.pointsToNext} pts to next` : `Max Lv.${MAX_LEVEL}`}
                            </span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-orange-500/10">
                                <Flame className="size-5 text-orange-500" />
                            </div>
                            <span className="text-2xl font-bold text-orange-500">{streak}</span>
                            <span className="text-xs text-muted-foreground">Week Streak (best: {highestStreak})</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                                <Award className="size-5 text-emerald-500" />
                            </div>
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {unlockedCount}/{totalCount}
                            </span>
                            <span className="text-xs text-muted-foreground">Badges Unlocked</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Level Progress */}
                <Card className="mb-8">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Level Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="font-medium">
                                Lv.{userLevel.level} {userLevel.title}
                            </span>
                            <span className="text-muted-foreground">
                                {userLevel.nextLevelMin
                                    ? `${points} / ${userLevel.nextLevelMin} pts`
                                    : "MAX LEVEL"}
                            </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                                style={{ width: `${Math.round(userLevel.progress * 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Badge Grid */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">All Badges</h2>
                    <p className="text-sm text-muted-foreground">
                        {unlockedCount === totalCount
                            ? "You've unlocked every badge. Congratulations!"
                            : `${totalCount - unlockedCount} badge${totalCount - unlockedCount === 1 ? "" : "s"} remaining. Keep going!`}
                    </p>
                </div>

                <AchievementsBadgeGrid unlockedBadges={badges} />
            </div>
        </div>
    );
}
