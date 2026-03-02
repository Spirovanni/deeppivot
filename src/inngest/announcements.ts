import { inngest } from "./client";
import { db } from "@/src/db";
import { usersTable, notificationsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { sendBatchEmails } from "@/src/lib/email";
import { AnnouncementEmail } from "@/emails/AnnouncementEmail";
import { createElement } from "react";

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

        // 1. Fetch all active users to notify (including email/name for digest)
        const users = await step.run("fetch-active-users", async () => {
            const activeUsers = await db
                .select({
                    id: usersTable.id,
                    email: usersTable.email,
                    name: usersTable.name,
                })
                .from(usersTable)
                .where(eq(usersTable.isDeleted, false));
            return activeUsers.filter(u => !!u.email); // Ensure we have emails
        });

        if (users.length === 0) return { success: true, count: 0 };

        // 2. Chunk and insert notifications + send emails (fan-out)
        const CHUNK_SIZE = 100; // Resend batch limit is 100
        const link = `/dashboard/announcements/${announcementId}`;

        const results = [];
        for (let i = 0; i < users.length; i += CHUNK_SIZE) {
            const chunk = users.slice(i, i + CHUNK_SIZE);

            const res = await step.run(`process-chunk-${i}`, async () => {
                // A. Insert in-app notifications
                await db.insert(notificationsTable).values(
                    chunk.map((user) => ({
                        userId: user.id,
                        title,
                        body,
                        type: "announcement" as const,
                        link,
                    }))
                );

                // B. Send email digest via Resend batch API
                const emailBatch = chunk.map(user => ({
                    to: user.email!, // Filtered above
                    subject: `DeepPivot: ${title}`,
                    react: createElement(AnnouncementEmail, {
                        userName: user.name?.split(" ")[0] ?? "there",
                        title,
                        body,
                        link,
                    }),
                }));

                const emailResult = await sendBatchEmails(emailBatch);

                return {
                    count: chunk.length,
                    emailSuccess: emailResult.success,
                    emailError: emailResult.error
                };
            });
            results.push(res);
        }

        return {
            success: true,
            count: users.length,
            chunks: results.length,
            details: results
        };
    }
);
