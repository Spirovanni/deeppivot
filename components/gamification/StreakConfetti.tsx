"use client";

import { useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

/**
 * Streak milestones that trigger a confetti celebration.
 * Every 4 weeks is a milestone (aligns with week-warrior badge at 4,
 * and streak-champion badge at 12).
 */
const STREAK_MILESTONES = [4, 8, 12, 26, 52] as const;

const STORAGE_KEY = "deeppivot:lastCelebratedStreak";

function isMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak as (typeof STREAK_MILESTONES)[number]);
}

function getLastCelebrated(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0;
}

function setLastCelebrated(streak: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(streak));
}

/**
 * Fires a multi-burst confetti celebration for streak milestones.
 * Mounts in the dashboard layout alongside PointsAnimation.
 *
 * Props:
 *  - streak: the user's current weekly streak (fetched by StreakBadge)
 */
export function StreakConfetti({ streak }: { streak: number }) {
  const hasFired = useRef(false);

  const fireConfetti = useCallback(() => {
    // Center burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#facc15", "#fb923c", "#fbbf24", "#ea580c"],
    });

    // Left side burst
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ["#f97316", "#facc15", "#fb923c"],
      });
    }, 200);

    // Right side burst
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ["#f97316", "#facc15", "#fb923c"],
      });
    }, 400);
  }, []);

  useEffect(() => {
    if (hasFired.current || streak <= 0) return;
    if (!isMilestone(streak)) return;

    const lastCelebrated = getLastCelebrated();
    if (lastCelebrated >= streak) return;

    hasFired.current = true;
    setLastCelebrated(streak);

    // Small delay so the dashboard has time to render
    const timer = setTimeout(fireConfetti, 600);
    return () => clearTimeout(timer);
  }, [streak, fireConfetti]);

  return null;
}
