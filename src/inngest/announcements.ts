import { inngest } from "./client";
import { db } from "@/src/db";
import { usersTable, notificationsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export const broadcastAnnouncement = inngest.createFunction(
    {
        id: "broadcast-announcement",
        name: "Broadcast Announcement",
        retries: 3,
    },
    { event: "admin/announcement.created" },
    async ({ event, step }) => {
        const { announcementId, title, body, sendToHome } = event.data as {
            announcementId: number;
            title: string;
            body: string;
            sendToHome: boolean;
        };

        if (!announcementId || !title || !body) {
            throw new Error("Missing required announcement data");
        }

        // 1. Fetch all active users to notify
        const users = await step.run("fetch-active-users", async () => {
            const activeUsers = await db
                .select({ id: usersTable.id })
                .from(usersTable)
                .where(eq(usersTable.isDeleted, false));
            return activeUsers;
        });

        if (users.length === 0) return { success: true, count: 0 };

        // 2. Chunk and insert notifications (fan-out)
        const CHUNK_SIZE = 100;
        const link = sendToHome ? `/dashboard/announcements/${announcementId}` : null;

        const results = [];
        for (let i = 0; i < users.length; i += CHUNK_SIZE) {
            const chunk = users.slice(i, i + CHUNK_SIZE);
            const res = await step.run(`insert-notification-chunk-${i}`, async () => {
                await db.insert(notificationsTable).values(
                    chunk.map((user) => ({
                        userId: user.id,
                        title,
                        body,
                        type: "announcement" as const,
                        link,
                    }))
                );
                return { count: chunk.length };
            });
            results.push(res);
        }

        return {
            success: true,
            count: users.length,
            chunks: results.length
        };
    }
);
