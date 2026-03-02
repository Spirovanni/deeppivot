import { create } from "zustand";

export interface PointsAward {
  id: string;
  points: number;
  label: string;
}

interface GamificationState {
  awards: PointsAward[];
}

interface GamificationActions {
  showPointsAnimation: (points: number, label?: string) => void;
  dismissAward: (id: string) => void;
}

type GamificationStore = GamificationState & GamificationActions;

let _awardCounter = 0;

export const useGamificationStore = create<GamificationStore>((set) => ({
  awards: [],

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
}));

/** Convenience hook for triggering the animation from any component */
export const useShowPointsAnimation = () =>
  useGamificationStore((s) => s.showPointsAnimation);
