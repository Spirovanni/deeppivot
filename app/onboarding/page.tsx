import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import OnboardingClient from "./onboarding-client";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getUserDashboardRoute, type UserRole } from "@/src/lib/rbac";

export const metadata: Metadata = {
    title: "Choose Your Path | DeepPivot",
    description:
        "Tell us how you'll use DeepPivot — as a Trailblazer growing your career, or a Talent Scout discovering talent.",
};

export default async function OnboardingPage() {
    // Guard: must be signed in
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
        redirect("/sign-in");
    }

    // Skip onboarding if user already has a non-default role
    const [row] = await db
        .select({ role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkUser.id))
        .limit(1);

    const role = (row?.role as UserRole) ?? "user";
    if (role !== "user") {
        redirect(getUserDashboardRoute(role));
    }

    return <OnboardingClient displayName={clerkUser.firstName ?? "there"} />;
}
