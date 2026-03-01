/**
 * In-app notification helpers — Phase 16.3
 *
 * Event triggers that create notifications for key platform events.
 */
import { db } from "@/src/db";
import { notificationsTable } from "@/src/db/schema";

export type NotificationType = "system" | "interview" | "mentor" | "career" | "announcement";

export interface CreateNotificationInput {
  userId: number;
  title: string;
  body: string;
  type?: NotificationType;
  link?: string | null;
}

/**
 * Create an in-app notification. Non-blocking: errors are logged but do not throw.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type ?? "system",
      link: input.link ?? null,
    });
  } catch (err) {
    console.error("[notifications] createNotification failed:", err);
  }
}
