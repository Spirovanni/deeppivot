/**
 * Gamification leveling system (Phase 16.4 — deeppivot-278)
 *
 * Point thresholds increase progressively so early levels come quickly
 * and later levels reward sustained engagement.
 */

export interface LevelInfo {
  level: number;
  title: string;
  /** Minimum points to reach this level */
  minPoints: number;
}

export const LEVELS: readonly LevelInfo[] = [
  { level: 1, title: "Newcomer", minPoints: 0 },
  { level: 2, title: "Explorer", minPoints: 50 },
  { level: 3, title: "Achiever", minPoints: 150 },
  { level: 4, title: "Specialist", minPoints: 300 },
  { level: 5, title: "Expert", minPoints: 500 },
  { level: 6, title: "Master", minPoints: 800 },
  { level: 7, title: "Champion", minPoints: 1200 },
  { level: 8, title: "Legend", minPoints: 1800 },
  { level: 9, title: "Titan", minPoints: 2500 },
  { level: 10, title: "Apex", minPoints: 3500 },
] as const;

export const MAX_LEVEL = LEVELS[LEVELS.length - 1].level;

export interface UserLevel {
  /** Current level number (1-10) */
  level: number;
  /** Level title (e.g. "Explorer") */
  title: string;
  /** Points required for the current level */
  currentLevelMin: number;
  /** Points required for the next level (null if max) */
  nextLevelMin: number | null;
  /** 0-1 progress fraction toward the next level */
  progress: number;
  /** Points still needed for the next level */
  pointsToNext: number;
}

/**
 * Calculate the user's level and progress from their total points.
 */
export function getUserLevel(points: number): UserLevel {
  let currentIdx = 0;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      currentIdx = i;
      break;
    }
  }

  const current = LEVELS[currentIdx];
  const next = LEVELS[currentIdx + 1] ?? null;

  if (!next) {
    return {
      level: current.level,
      title: current.title,
      currentLevelMin: current.minPoints,
      nextLevelMin: null,
      progress: 1,
      pointsToNext: 0,
    };
  }

  const range = next.minPoints - current.minPoints;
  const earned = points - current.minPoints;
  const progress = Math.min(earned / range, 1);

  return {
    level: current.level,
    title: current.title,
    currentLevelMin: current.minPoints,
    nextLevelMin: next.minPoints,
    progress,
    pointsToNext: next.minPoints - points,
  };
}
