import { db } from "@/src/db";
import { systemSettingsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

function toBoolean(value: string | null | undefined): boolean {
  if (!value) return true;
  return value.toLowerCase() !== "false";
}

export function gamificationPreferenceKey(userId: number): string {
  return `gamification:user:${userId}:enabled`;
}

/**
 * Returns whether gamification is enabled for a user.
 * Defaults to true when no explicit setting exists.
 */
export async function isGamificationEnabled(userId: number): Promise<boolean> {
  const [row] = await db
    .select({ value: systemSettingsTable.value })
    .from(systemSettingsTable)
    .where(eq(systemSettingsTable.key, gamificationPreferenceKey(userId)))
    .limit(1);

  return toBoolean(row?.value);
}

