"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { GAMIFICATION_BADGES } from "@/src/lib/gamification-badges";
import { BADGE_RULES, type BadgeCategory } from "@/src/lib/badge-rules";
import { cn } from "@/src/lib/utils";

interface UnlockedBadge {
    id: string;
    label: string;
    iconPath: string | null;
    unlockedAt: string;
}

interface AchievementsBadgeGridProps {
    unlockedBadges: UnlockedBadge[];
}

const CATEGORY_COLORS: Record<BadgeCategory, string> = {
    general: "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20",
    interview: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
    planning: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
    consistency: "bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-orange-500/20",
    jobs: "bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-pink-500/20",
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
    general: "General",
    interview: "Interview",
    planning: "Planning",
    consistency: "Consistency",
    jobs: "Jobs",
};

export function AchievementsBadgeGrid({ unlockedBadges }: AchievementsBadgeGridProps) {
    const unlockedIds = new Set(unlockedBadges.map((b) => b.id));
    const unlockedMap = new Map(unlockedBadges.map((b) => [b.id, b]));

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GAMIFICATION_BADGES.map((badge, idx) => {
                const isUnlocked = unlockedIds.has(badge.id);
                const unlocked = unlockedMap.get(badge.id);
                const rule = BADGE_RULES.find((r) => r.id === badge.id);
                const category = rule?.category ?? "general";

                return (
                    <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                            "relative flex items-start gap-4 rounded-xl border p-4 transition-all",
                            isUnlocked
                                ? "border-primary/20 bg-background shadow-sm"
                                : "border-border/50 bg-muted/30 opacity-60"
                        )}
                    >
                        {/* Badge Icon */}
                        <div
                            className={cn(
                                "relative flex size-16 shrink-0 items-center justify-center rounded-full p-2",
                                isUnlocked
                                    ? "bg-accent/50 ring-2 ring-primary/20"
                                    : "bg-muted ring-1 ring-border"
                            )}
                        >
                            {isUnlocked ? (
                                <Image
                                    src={badge.path}
                                    alt={badge.label}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                />
                            ) : (
                                <>
                                    <Image
                                        src={badge.path}
                                        alt={badge.label}
                                        width={48}
                                        height={48}
                                        className="object-contain opacity-20 grayscale"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock className="size-5 text-muted-foreground/60" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Badge Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className={cn(
                                    "text-sm font-semibold truncate",
                                    !isUnlocked && "text-muted-foreground"
                                )}>
                                    {badge.label}
                                </h3>
                            </div>

                            <span
                                className={cn(
                                    "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                                    CATEGORY_COLORS[category]
                                )}
                            >
                                {CATEGORY_LABELS[category]}
                            </span>

                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                                {rule?.description ?? "Complete the challenge to unlock."}
                            </p>

                            {isUnlocked && unlocked?.unlockedAt && (
                                <p className="mt-1 text-[10px] text-muted-foreground/70">
                                    Unlocked {new Date(unlocked.unlockedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
