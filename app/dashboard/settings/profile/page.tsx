import { getUserProfile } from "@/src/lib/actions/profile";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProfileSettingsClient } from "./_components/ProfileSettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings | Deep Pivot",
};

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const profile = await getUserProfile().catch(() => null);
  if (!profile) redirect("/sign-in");

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">
            Update your personal information and public profile.
          </p>
        </div>
        <ProfileSettingsClient
          profile={profile}
          clerkImageUrl={clerkUser.imageUrl}
        />
      </div>
    </div>
  );
}
