"use server";

import { db } from "@/src/db";
import { systemSettingsTable } from "@/src/db/schema";
import { requireSystemAdmin } from "@/src/lib/rbac";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export type SystemSetting = {
    key: string;
    value: string;
    type: "boolean" | "number" | "string" | "json";
    description: string | null;
    updatedAt: Date;
    updatedBy: number | null;
};

export async function getSystemSettings(): Promise<SystemSetting[]> {
    const results = await db.select().from(systemSettingsTable).orderBy(systemSettingsTable.key);
    return results as SystemSetting[];
}

export async function getSystemSetting(key: string): Promise<string | null> {
    const [setting] = await db
        .select({ value: systemSettingsTable.value })
        .from(systemSettingsTable)
        .where(eq(systemSettingsTable.key, key))
        .limit(1);

    return setting?.value ?? null;
}

export async function updateSystemSetting(key: string, value: string) {
    // Only system_admins can change critical system toggles
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await requireSystemAdmin(); // This also throws if not admin

    await db
        .insert(systemSettingsTable)
        .values({
            key,
            value,
            updatedBy: user.id,
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: systemSettingsTable.key,
            set: {
                value,
                updatedBy: user.id,
                updatedAt: new Date(),
            },
        });

    revalidatePath("/admin/settings");
    return { success: true };
}

export async function bulkUpdateSystemSettings(settings: { key: string; value: string }[]) {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await requireSystemAdmin();

    const updates = settings.map((s) =>
        db.insert(systemSettingsTable)
            .values({
                key: s.key,
                value: s.value,
                updatedBy: user.id,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: systemSettingsTable.key,
                set: {
                    value: s.value,
                    updatedBy: user.id,
                    updatedAt: new Date(),
                },
            })
    );

    await Promise.all(updates);

    revalidatePath("/admin/settings");
    return { success: true };
}
