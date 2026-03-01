"use server";

import { db } from "@/src/db";
import {
  adminAnnouncementsTable,
  userAnnouncementDismissalsTable,
} from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";

/** Latest send-to-home announcement not yet dismissed by the user (deeppivot-257) */
export async function getPendingSendToHomeAnnouncement(
  userId: number
): Promise<{ id: number; title: string; body: string } | null> {
  const [latest] = await db
    .select({
      id: adminAnnouncementsTable.id,
      title: adminAnnouncementsTable.title,
      body: adminAnnouncementsTable.body,
    })
    .from(adminAnnouncementsTable)
    .where(eq(adminAnnouncementsTable.sendToHome, true))
    .orderBy(desc(adminAnnouncementsTable.createdAt))
    .limit(1);

  if (!latest) return null;

  const dismissals = await db
    .select({ announcementId: userAnnouncementDismissalsTable.announcementId })
    .from(userAnnouncementDismissalsTable)
    .where(eq(userAnnouncementDismissalsTable.userId, userId));
  const dismissedIds = dismissals.map((d) => d.announcementId);
  if (dismissedIds.includes(latest.id)) return null;
  return latest;
}

/** Record that the user has dismissed an announcement (deeppivot-257) */
export async function dismissAnnouncement(
  userId: number,
  announcementId: number
): Promise<{ success: boolean }> {
  try {
    await db
      .insert(userAnnouncementDismissalsTable)
      .values({ userId, announcementId })
      .onConflictDoNothing({
        target: [userAnnouncementDismissalsTable.userId, userAnnouncementDismissalsTable.announcementId],
      });
    return { success: true };
  } catch {
    return { success: false };
  }
}
