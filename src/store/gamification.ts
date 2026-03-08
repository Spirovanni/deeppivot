import { create } from "zustand";

export interface PointsAward {
  id: string;
  points: number;
  label: string;
}

export interface BadgeUnlock {
  badgeId: string;
  label: string;
  description: string;
  iconPath: string;
}

interface GamificationState {
  awards: PointsAward[];
  pendingBadgeUnlock: BadgeUnlock | null;
}

interface GamificationActions {
  showPointsAnimation: (points: number, label?: string) => void;
  dismissAward: (id: string) => void;
  showBadgeUnlock: (unlock: BadgeUnlock) => void;
  dismissBadgeUnlock: () => void;
}

type GamificationStore = GamificationState & GamificationActions;

let _awardCounter = 0;

export const useGamificationStore = create<GamificationStore>((set) => ({
  awards: [],
  pendingBadgeUnlock: null,

  showPointsAnimation: (points, label) =>
    set((state) => ({
      awards: [
        ...state.awards,
        {
          id: `pts-${++_awardCounter}`,
          points,
          label: label ?? "Points earned!",
        },
      ],
    })),

  dismissAward: (id) =>
    set((state) => ({
      awards: state.awards.filter((a) => a.id !== id),
    })),

  showBadgeUnlock: (unlock) =>
    set({ pendingBadgeUnlock: unlock }),

  dismissBadgeUnlock: () =>
    set({ pendingBadgeUnlock: null }),
}));

/** Convenience hook for triggering the animation from any component */
export const useShowPointsAnimation = () =>
  useGamificationStore((s) => s.showPointsAnimation);
