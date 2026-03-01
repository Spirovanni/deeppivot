import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { usersTable, notificationsTable } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { Bell } from "lucide-react";
import { NotificationList } from "./_components/NotificationList";

export const metadata = {
    title: "Notifications | DeepPivot",
    description: "View all your in-app notifications.",
};

const PAGE_SIZE = 50;

export default async function NotificationsPage() {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/sign-in");

    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId))
        .limit(1);
    if (!user) redirect("/sign-in");

    const notifications = await db
        .select({
            id: notificationsTable.id,
            title: notificationsTable.title,
            body: notificationsTable.body,
            isRead: notificationsTable.isRead,
            type: notificationsTable.type,
            link: notificationsTable.link,
            createdAt: notificationsTable.createdAt,
        })
        .from(notificationsTable)
        .where(eq(notificationsTable.userId, user.id))
        .orderBy(desc(notificationsTable.createdAt))
        .limit(PAGE_SIZE);

    const items = notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
    }));

    return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
            <div className="flex items-center gap-3">
                <Bell className="size-6 text-muted-foreground" />
                <div>
                    <h1 className="text-xl font-semibold">Notifications</h1>
                    <p className="text-sm text-muted-foreground">
                        {items.filter((n) => !n.isRead).length} unread
                    </p>
                </div>
            </div>

            <NotificationList notifications={items} />
        </div>
    );
}
