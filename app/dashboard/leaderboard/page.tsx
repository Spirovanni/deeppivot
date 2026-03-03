import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Medal, Trophy, Flame, Sparkles, ShieldAlert } from "lucide-react";
import { getLeaderboardData, getGamificationStatus } from "@/src/lib/actions/gamification";
import { getUserProfile } from "@/src/lib/actions/profile";
import { LeaderboardTable } from "./_components/LeaderboardTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LeaderboardPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const [leaderboard, status, profile] = await Promise.all([
        getLeaderboardData(),
        getGamificationStatus(),
        getUserProfile(),
    ]);

    const isPublic = profile.isLeaderboardPublic;

    return (
        <div className="p-6 md:p-8">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
                            <Medal className="size-7 text-amber-500" />
                            Leaderboard
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            See how you stack up against other career trailblazers.
                        </p>
                    </div>
                    {!isPublic && (
                        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            <ShieldAlert className="size-5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold">Your profile is private</p>
                                <p>You won't appear on the leaderboard until you opt-in.</p>
                            </div>
                            <Button asChild variant="outline" size="sm" className="ml-auto bg-white dark:bg-amber-950">
                                <Link href="/dashboard/settings/profile">Opt-in</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Top 3 Podium (Optional but looks premium) */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {leaderboard.slice(0, 3).map((entry, index) => (
                        <Card key={entry.id} className={`${index === 0 ? "border-amber-500 shadow-amber-500/10 shadow-lg" : ""}`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {index === 0 ? "🥇 1st Place" : index === 1 ? "🥈 2nd Place" : "🥉 3rd Place"}
                                </CardTitle>
                                {index === 0 && <Trophy className="size-5 text-amber-500" />}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {entry.avatarUrl ? (
                                            <img src={entry.avatarUrl} alt={entry.name} className="size-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                                                {entry.name?.[0] ?? "?"}
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white ${index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : "bg-orange-600"}`}>
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{entry.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-0.5"><Sparkles className="size-3 text-primary" /> {entry.points} pts</span>
                                            <span className="flex items-center gap-0.5"><Flame className="size-3 text-orange-500" /> {entry.currentStreak}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Rankings</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <LeaderboardTable
                            data={leaderboard}
                            currentUserId={profile.id}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
