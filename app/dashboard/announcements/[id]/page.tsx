import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/src/db";
import { adminAnnouncementsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { ensureUserInDb } from "@/src/lib/actions/ensure-user";
import { AnnouncementView } from "./_components/AnnouncementView";

type Props = { params: Promise<{ id: string }> };

export default async function AnnouncementPage({ params }: Props) {
  const { id } = await params;
  const announcementId = parseInt(id, 10);
  if (Number.isNaN(announcementId)) notFound();

  const userId = await ensureUserInDb();
  if (userId === null) redirect("/sign-in");

  const [announcement] = await db
    .select({
      id: adminAnnouncementsTable.id,
      title: adminAnnouncementsTable.title,
      body: adminAnnouncementsTable.body,
      sendToHome: adminAnnouncementsTable.sendToHome,
      createdAt: adminAnnouncementsTable.createdAt,
    })
    .from(adminAnnouncementsTable)
    .where(eq(adminAnnouncementsTable.id, announcementId))
    .limit(1);

  if (!announcement) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <AnnouncementView
        announcementId={announcement.id}
        title={announcement.title}
        body={announcement.body}
        sendToHome={announcement.sendToHome}
        createdAt={announcement.createdAt}
        userId={userId}
      />
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
