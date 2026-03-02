"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useGamificationStore } from "@/src/store/gamification";

const DISPLAY_DURATION_MS = 2400;

function PointsBubble({
  id,
  points,
  label,
  onDone,
}: {
  id: string;
  points: number;
  label: string;
  onDone: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(id), DISPLAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [id, onDone]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.6 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pointer-events-none flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/90 to-yellow-400/90 px-4 py-2 shadow-lg shadow-amber-500/25 backdrop-blur-sm"
    >
      <Sparkles className="size-4 text-white" />
      <span className="text-sm font-bold text-white">+{points}</span>
      <span className="text-xs font-medium text-white/80">{label}</span>
    </motion.div>
  );
}

/**
 * Global floating points animation overlay.
 * Mount once in the dashboard layout.
 */
export function PointsAnimation() {
  const awards = useGamificationStore((s) => s.awards);
  const dismissAward = useGamificationStore((s) => s.dismissAward);

  return (
    <div className="pointer-events-none fixed bottom-8 right-8 z-[100] flex flex-col-reverse items-end gap-3">
      <AnimatePresence mode="popLayout">
        {awards.map((award) => (
          <PointsBubble
            key={award.id}
            id={award.id}
            points={award.points}
            label={award.label}
            onDone={dismissAward}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
