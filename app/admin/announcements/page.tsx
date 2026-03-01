import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { adminAnnouncementsTable, usersTable } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Megaphone } from "lucide-react";

export const metadata = {
    title: "Announcements | Admin",
};

const PAGE_SIZE = 50;

export default async function AdminAnnouncementsPage() {
    await requireAdmin();

    const announcements = await db
        .select({
            id: adminAnnouncementsTable.id,
            title: adminAnnouncementsTable.title,
            body: adminAnnouncementsTable.body,
            sendToHome: adminAnnouncementsTable.sendToHome,
            createdAt: adminAnnouncementsTable.createdAt,
            creatorName: usersTable.name,
        })
        .from(adminAnnouncementsTable)
        .leftJoin(usersTable, eq(adminAnnouncementsTable.createdBy, usersTable.id))
        .orderBy(desc(adminAnnouncementsTable.createdAt))
        .limit(PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Megaphone className="size-5 text-amber-400" />
                    <h1 className="text-xl font-bold">Announcements</h1>
                    <span className="text-sm text-muted-foreground">
                        ({announcements.length} broadcast{announcements.length !== 1 ? "s" : ""})
                    </span>
                </div>
                <Link
                    href="/admin/announcements/new"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    New Announcement
                </Link>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
                {announcements.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <p>No announcements yet.</p>
                        <p className="text-sm mt-1">
                            Create an announcement to broadcast to users via the in-app notification center.
                        </p>
                        <Link
                            href="/admin/announcements/new"
                            className="mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                        >
                            Create first announcement
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground max-w-xs">Preview</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created by</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.map((a) => (
                                <tr key={a.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                        {a.title}
                                        {a.sendToHome && (
                                            <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                                                Send to Home
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={a.body}>
                                        {a.body.slice(0, 80)}
                                        {a.body.length > 80 ? "…" : ""}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {a.creatorName ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {a.createdAt instanceof Date
                                            ? a.createdAt.toLocaleDateString("en-US", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : String(a.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
