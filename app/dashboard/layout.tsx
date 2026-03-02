import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { ensureUserInDb } from "@/src/lib/actions/ensure-user";
import { getPendingSendToHomeAnnouncement } from "@/src/lib/actions/announcements";
import { DashboardConnectionError } from "@/components/dashboard/DashboardConnectionError";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { SendToHomeRedirect } from "./_components/SendToHomeRedirect";
import { PointsAnimation } from "@/components/gamification/PointsAnimation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUserId = await ensureUserInDb();
  if (dbUserId === null) {
    return <DashboardConnectionError />;
  }

  const pendingAnnouncement = await getPendingSendToHomeAnnouncement(dbUserId);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <SendToHomeRedirect pendingAnnouncementId={pendingAnnouncement?.id ?? null} />
      <DashboardSidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <DashboardTopBar />
        <div className="flex-1">{children}</div>
      </main>
      <SessionTimeoutWarning />
      <FeedbackWidget />
      <PointsAnimation />
    </div>
  );
}

