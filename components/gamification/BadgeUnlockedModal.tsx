"use client";

import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, X } from "lucide-react";
import confetti from "canvas-confetti";
import Image from "next/image";
import { useGamificationStore } from "@/src/store/gamification";

/**
 * Celebration modal shown when the user unlocks a new badge.
 * Triggered via the gamification Zustand store and mounted in the dashboard layout.
 */
export function BadgeUnlockedModal() {
  const pendingBadgeUnlock = useGamificationStore((s) => s.pendingBadgeUnlock);
  const dismissBadgeUnlock = useGamificationStore((s) => s.dismissBadgeUnlock);

  const fireConfetti = useCallback(() => {
    // Gold/amber celebration burst
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#f59e0b", "#fbbf24", "#d97706", "#fcd34d", "#b45309"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 50,
        origin: { x: 0.15, y: 0.55 },
        colors: ["#f59e0b", "#fbbf24", "#d97706"],
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 50,
        origin: { x: 0.85, y: 0.55 },
        colors: ["#f59e0b", "#fbbf24", "#d97706"],
      });
    }, 300);
  }, []);

  useEffect(() => {
    if (pendingBadgeUnlock) {
      const timer = setTimeout(fireConfetti, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingBadgeUnlock, fireConfetti]);

  // Close on Escape key
  useEffect(() => {
    if (!pendingBadgeUnlock) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissBadgeUnlock();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pendingBadgeUnlock, dismissBadgeUnlock]);

  return (
    <AnimatePresence>
      {pendingBadgeUnlock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={dismissBadgeUnlock}
          role="dialog"
          aria-modal="true"
          aria-label={`Badge unlocked: ${pendingBadgeUnlock.label}`}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-card to-card/95 p-8 shadow-2xl shadow-amber-500/20"
          >
            <button
              onClick={dismissBadgeUnlock}
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <motion.div
              initial={{ rotate: -15, scale: 0.3 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.15 }}
              className="flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-500/20 p-4"
            >
              <div className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500/30 to-yellow-400/30 p-3">
                <Image
                  src={pendingBadgeUnlock.iconPath}
                  alt={pendingBadgeUnlock.label}
                  width={72}
                  height={72}
                  className="drop-shadow-lg"
                />
              </div>
            </motion.div>

            <div className="flex items-center gap-2 text-amber-500">
              <Trophy className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Achievement Unlocked
              </span>
              <Trophy className="size-4" />
            </div>

            <h2 className="text-center text-xl font-bold text-foreground">
              {pendingBadgeUnlock.label}
            </h2>

            <p className="text-center text-sm text-muted-foreground">
              {pendingBadgeUnlock.description}
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={dismissBadgeUnlock}
              className="mt-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-shadow hover:shadow-amber-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
