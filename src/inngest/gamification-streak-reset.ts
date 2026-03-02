/**
 * Inngest cron: Reset expired gamification streaks
 *
 * Runs daily at 2 AM UTC. Resets 'currentStreak' to 0 for users who
 * have not had any activity in the current or previous calendar week.
 */

import { inngest } from "@/src/inngest/client";
import { resetExpiredStreaks } from "@/src/lib/gamification";

export const gamificationStreakReset = inngest.createFunction(
    {
        id: "gamification-streak-reset",
        name: "Reset Expired Gamification Streaks",
        retries: 1,
    },
    { cron: "0 2 * * *" }, // 2 AM UTC daily
    async ({ step }) => {
        const result = await step.run("reset-streaks", async () => {
            return resetExpiredStreaks();
        });

        return {
            resetCount: result.resetCount,
            timestamp: new Date().toISOString()
        };
    }
);
