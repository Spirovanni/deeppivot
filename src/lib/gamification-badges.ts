/**
 * Gamification achievement badges (Phase 16.4)
 *
 * 10 SVG badge icons in /badges/*.svg for the Gamification Hub.
 */

export const GAMIFICATION_BADGES = [
  { id: "first-steps", label: "First Steps", path: "/badges/first-steps.svg" },
  { id: "interview-ace", label: "Interview Ace", path: "/badges/interview-ace.svg" },
  { id: "milestone-master", label: "Milestone Master", path: "/badges/milestone-master.svg" },
  { id: "week-warrior", label: "Week Warrior", path: "/badges/week-warrior.svg" },
  { id: "streak-champion", label: "Streak Champion", path: "/badges/streak-champion.svg" },
  { id: "points-pioneer", label: "Points Pioneer", path: "/badges/points-pioneer.svg" },
  { id: "interview-pro", label: "Interview Pro", path: "/badges/interview-pro.svg" },
  { id: "career-planner", label: "Career Planner", path: "/badges/career-planner.svg" },
  { id: "job-hunter", label: "Job Hunter", path: "/badges/job-hunter.svg" },
  { id: "all-rounder", label: "All-Rounder", path: "/badges/all-rounder.svg" },
] as const;

export type BadgeId = (typeof GAMIFICATION_BADGES)[number]["id"];
