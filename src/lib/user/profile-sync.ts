import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

/**
 * Synchronizes a user's profile fields in the database with data extracted from their resume.
 * This function preserves existing user-provided data by only filling in fields that are 
 * empty or currently set to generic defaults.
 * 
 * @param userId The database ID of the user
 * @param data The structured data extracted from the resume
 */
export async function syncProfileFromResume(userId: number, data: ResumeExtraction) {
    try {
        const [user] = await db
            .select({
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                bio: usersTable.bio,
                phone: usersTable.phone,
            })
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        if (!user) return;

        const updates: Partial<typeof usersTable.$inferSelect> = {};

        // 1. Handle Name (Clerk default is often "User")
        const isGenericFirst = user.firstName.toLowerCase() === "user" || !user.firstName;
        const isGenericLast = !user.lastName;

        if ((isGenericFirst || isGenericLast) && data.fullName) {
            const parts = data.fullName.split(" ");
            if (parts.length >= 2) {
                if (isGenericFirst) updates.firstName = parts[0];
                if (isGenericLast) updates.lastName = parts.slice(1).join(" ");
            } else if (isGenericFirst) {
                updates.firstName = data.fullName;
            }
        }

        // 2. Handle Bio (Preserve existing if it looks meaningful)
        const currentBioLength = user.bio?.trim().length || 0;
        if (currentBioLength < 10 && data.summary) {
            updates.bio = data.summary;
        }

        // 3. Handle Phone
        if (!user.phone && data.phone) {
            updates.phone = data.phone;
        }

        // Apply updates if any exist
        if (Object.keys(updates).length > 0) {
            await db
                .update(usersTable)
                .set({
                    ...updates,
                    updatedAt: new Date(),
                })
                .where(eq(usersTable.id, userId));
        }
    } catch (error) {
        console.error(`Failed to sync profile from resume for user ${userId}:`, error);
    }
}
