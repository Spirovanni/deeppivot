"use client";

import { useRouter } from "next/navigation";

interface Notification {
    id: number;
    title: string;
    body: string;
    isRead: boolean;
    type: string;
    link: string | null;
    createdAt: string;
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
    const router = useRouter();

    const handleClick = async (n: Notification) => {
        if (!n.isRead) {
            try {
                await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
            } catch {
                // ignore
            }
        }
        if (n.link) router.push(n.link);
    };

    if (notifications.length === 0) {
        return (
            <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                No notifications yet
            </p>
        );
    }

    return (
        <ul className="space-y-2">
            {notifications.map((n) => (
                <li key={n.id}>
                    <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className={`w-full text-left rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                            !n.isRead ? "bg-muted/30 border-primary/20" : ""
                        }`}
                    >
                        <p className="font-medium">{n.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {n.body}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(n.createdAt).toLocaleString()}
                        </p>
                    </button>
                </li>
            ))}
        </ul>
    );
}
