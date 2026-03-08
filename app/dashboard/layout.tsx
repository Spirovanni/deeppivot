import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { ensureUserInDb } from "@/src/lib/actions/ensure-user";
import {
  getPendingSendToHomeAnnouncement,
  getLatestAnnouncement
} from "@/src/lib/actions/announcements";
import { DashboardConnectionError } from "@/components/dashboard/DashboardConnectionError";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { SendToHomeRedirect } from "./_components/SendToHomeRedirect";
import { PointsAnimation } from "@/components/gamification/PointsAnimation";
import { BadgeUnlockedModal } from "@/components/gamification/BadgeUnlockedModal";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import NotificationToastSync from "@/components/dashboard/NotificationToastSync";

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
  const latestAnnouncement = await getLatestAnnouncement(dbUserId);

  // Only show banner if it's not a forced redirect announcement (deeppivot-258)
  const showBanner = latestAnnouncement && !latestAnnouncement.sendToHome;

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <SendToHomeRedirect pendingAnnouncementId={pendingAnnouncement?.id ?? null} />
      <DashboardSidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <DashboardTopBar />
        <NotificationToastSync />
        {showBanner && (
          <AnnouncementBanner
            announcement={latestAnnouncement!}
            userId={dbUserId}
          />
        )}
        <div className="flex-1">{children}</div>
      </main>
      <SessionTimeoutWarning />
      <FeedbackWidget />
      <PointsAnimation />
      <BadgeUnlockedModal />
    </div>
  );
}

