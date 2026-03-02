"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Star, Sparkles, ChevronRight, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { GamificationStatus } from "@/src/lib/actions/gamification";
import { getUserLevel, MAX_LEVEL } from "@/src/lib/gamification-levels";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

interface GamificationHubProps {
    status: GamificationStatus | null;
}

export function GamificationHub({ status }: GamificationHubProps) {
    if (!status) return null;

    const hasBadges = status.badges.length > 0;
    const recentBadges = status.badges.slice(-3).reverse();
    const userLevel = getUserLevel(status.points);

    return (
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
            {/* Decorative background flare */}
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-3xl" />

            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Trophy className="size-5 text-amber-500" />
                            Gamification Hub
                        </CardTitle>
                        <CardDescription>Level up your career journey</CardDescription>
                    </div>
                    <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                        All Badges
                        <ChevronRight className="size-4" />
                    </Link>
                </div>
            </CardHeader>

            <CardContent>
                {/* Level Progress Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/10"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                {userLevel.level}
                            </div>
                            <div>
                                <span className="text-sm font-semibold">{userLevel.title}</span>
                                <span className="ml-1.5 text-xs text-muted-foreground">Lv.{userLevel.level}</span>
                            </div>
                        </div>
                        {userLevel.nextLevelMin !== null ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="size-3" />
                                <span>{userLevel.pointsToNext} pts to Lv.{userLevel.level + 1}</span>
                            </div>
                        ) : (
                            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
                                MAX
                            </Badge>
                        )}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(userLevel.progress * 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{status.points} pts</span>
                        <span>{userLevel.nextLevelMin !== null ? `${userLevel.nextLevelMin} pts` : `Lv.${MAX_LEVEL}`}</span>
                    </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Points Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center justify-center rounded-xl bg-primary/5 p-4 text-center ring-1 ring-primary/10"
                    >
                        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10">
                            <Sparkles className="size-5 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-primary">{status.points}</span>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Points</span>
                    </motion.div>

                    {/* Streak Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center justify-center rounded-xl bg-orange-500/5 p-4 text-center ring-1 ring-orange-500/10"
                    >
                        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-orange-500/10">
                            <Flame className={cn(
                                "size-5 transition-colors",
                                status.currentStreak > 0 ? "text-orange-500 animate-pulse" : "text-muted-foreground"
                            )} />
                        </div>
                        <span className="text-2xl font-bold text-orange-500">{status.currentStreak}</span>
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Week Streak</span>
                    </motion.div>
                </div>

                {/* Recent Achievements */}
                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                            <Award className="size-4 text-primary" />
                            Recent Achievements
                        </h4>
                    </div>

                    <div className="flex items-start gap-4">
                        {hasBadges ? (
                            <div className="grid grid-cols-3 w-full gap-2">
                                {recentBadges.map((badge, idx) => (
                                    <motion.div
                                        key={badge.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2 + idx * 0.1 }}
                                        className="group relative flex flex-col items-center gap-1.5"
                                    >
                                        <div className="relative size-14 rounded-full bg-accent/50 p-2 flex items-center justify-center ring-1 ring-border group-hover:ring-primary/50 transition-all shadow-sm">
                                            {badge.iconPath ? (
                                                <Image
                                                    src={badge.iconPath}
                                                    alt={badge.label}
                                                    width={40}
                                                    height={40}
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <Star className="size-6 text-primary" />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-medium text-center line-clamp-1 w-full">{badge.label}</span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex w-full flex-col items-center justify-center py-4 rounded-lg bg-accent/20 border border-dashed text-center">
                                <div className="p-3 rounded-full bg-background mb-2">
                                    <Star className="size-5 text-muted-foreground/30" />
                                </div>
                                <p className="text-xs text-muted-foreground max-w-[150px]">
                                    No badges yet. Start practicing to earn your first one!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Mini-Feed */}
                {status.recentEvents.length > 0 && (
                    <div className="mt-6">
                        <Separator className="mb-4 opacity-50" />
                        <div className="space-y-2">
                            {status.recentEvents.slice(0, 2).map((event, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground truncate max-w-[160px]">
                                        {event.eventType.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                                    </span>
                                    <span className="font-semibold text-primary">+{event.points} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function GamificationHubSkeleton() {
    return (
        <Card className="overflow-hidden border-primary/20">
            <CardHeader className="pb-2">
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-1 h-4 w-48 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 animate-pulse rounded-xl bg-muted" />
                    <div className="h-24 animate-pulse rounded-xl bg-muted" />
                </div>
                <div className="mt-6 h-20 animate-pulse rounded-xl bg-muted" />
            </CardContent>
        </Card>
    );
}
