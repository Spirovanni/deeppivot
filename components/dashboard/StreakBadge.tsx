"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

export function StreakBadge() {
    const [streak, setStreak] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStreak() {
            try {
                const res = await fetch("/api/gamification/status");
                if (res.ok) {
                    const data = await res.json();
                    setStreak(data.currentStreak);
                }
            } catch (error) {
                console.error("Failed to fetch streak:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStreak();
    }, []);

    if (loading || streak === null || streak === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 ring-1 ring-orange-500/20"
            title={`Weekly Streak: ${streak} weeks active`}
        >
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <Flame className="size-4 fill-orange-500 text-orange-500" />
            </motion.div>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {streak}
            </span>
        </motion.div>
    );
}
