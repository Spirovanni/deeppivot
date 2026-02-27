"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserDashboardRoute, type UserRole } from "@/src/lib/rbac";

export type TrackChoice = "trailblazer" | "talent-scout";

const TRACK_TO_ROLE: Record<TrackChoice, UserRole> = {
    "trailblazer": "user",
    "talent-scout": "employer",
};

/**
 * Sets the user's platform track after the onboarding chooser.
 * Updates their role in the DB and redirects to their role dashboard.
 */
export async function setUserTrack(track: TrackChoice): Promise<void> {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
        redirect("/sign-in");
    }

    const newRole = TRACK_TO_ROLE[track];

    await db
        .update(usersTable)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(usersTable.clerkId, clerkUser.id));

    revalidatePath("/dashboard");

    redirect(getUserDashboardRoute(newRole));
}

/**
 * Switches a trailblazer user to employer role and redirects to employer onboarding.
 * Used by the "Switch to Employer Mode" CTA on the Trailblazer dashboard.
 */
export async function switchToEmployer(): Promise<void> {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
        redirect("/sign-in");
    }

    await db
        .update(usersTable)
        .set({ role: "employer" as UserRole, updatedAt: new Date() })
        .where(eq(usersTable.clerkId, clerkUser.id));

    revalidatePath("/dashboard");

    redirect("/employer/onboarding");
}

/**
 * Returns the current user's role from the DB,
 * or null if unauthenticated / not found.
 */
export async function getCurrentUserRoleAction(): Promise<UserRole | null> {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) return null;

    const [row] = await db
        .select({ role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkUser.id))
        .limit(1);

    return (row?.role as UserRole) ?? null;
}
