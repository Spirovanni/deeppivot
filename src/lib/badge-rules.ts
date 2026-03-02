import { BadgeId } from "./gamification-badges";

export type BadgeCategory = "general" | "interview" | "planning" | "consistency" | "jobs";

export interface BadgeRule {
    id: BadgeId;
    category: BadgeCategory;
    description: string;
    evaluate: (stats: UserStats) => boolean;
}

export interface UserStats {
    totalPoints: number;
    currentStreak: number;
    highestStreak: number;
    completedInterviewsCount: number;
    bestInterviewScore: number;
    completedMilestonesCount: number;
    createdMilestonesCount: number;
    jobApplicationsCount: number;
    unlockedBadgeIds: string[];
}

export const BADGE_RULES: BadgeRule[] = [
    {
        id: "first-steps",
        category: "general",
        description: "Earn your first points.",
        evaluate: (stats) => stats.totalPoints > 0,
    },
    {
        id: "interview-ace",
        category: "interview",
        description: "Score 90 or higher in an interview.",
        evaluate: (stats) => stats.bestInterviewScore >= 90,
    },
    {
        id: "milestone-master",
        category: "planning",
        description: "Complete 5 career milestones.",
        evaluate: (stats) => stats.completedMilestonesCount >= 5,
    },
    {
        id: "week-warrior",
        category: "consistency",
        description: "Maintain a 4-week streak.",
        evaluate: (stats) => stats.highestStreak >= 4,
    },
    {
        id: "streak-champion",
        category: "consistency",
        description: "Maintain a 12-week streak.",
        evaluate: (stats) => stats.highestStreak >= 12,
    },
    {
        id: "points-pioneer",
        category: "general",
        description: "Accumulate 500 total points.",
        evaluate: (stats) => stats.totalPoints >= 500,
    },
    {
        id: "interview-pro",
        category: "interview",
        description: "Complete 10 interview practice sessions.",
        evaluate: (stats) => stats.completedInterviewsCount >= 10,
    },
    {
        id: "career-planner",
        category: "planning",
        description: "Create at least 5 career milestones.",
        evaluate: (stats) => stats.createdMilestonesCount >= 5,
    },
    {
        id: "job-hunter",
        category: "jobs",
        description: "Submit 10 job applications.",
        evaluate: (stats) => stats.jobApplicationsCount >= 10,
    },
    {
        id: "all-rounder",
        category: "general",
        description: "Unlock badges in 3 different categories.",
        evaluate: (stats) => {
            const unlockedCategories = new Set<BadgeCategory>();
            BADGE_RULES.forEach((rule) => {
                if (rule.id !== "all-rounder" && stats.unlockedBadgeIds.includes(rule.id)) {
                    unlockedCategories.add(rule.category);
                }
            });
            return unlockedCategories.size >= 3;
        },
    },
];
