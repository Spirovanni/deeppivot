"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Mic2, Users, Megaphone, BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

const TYPE_ICONS: Record<string, React.ElementType> = {
    interview: Mic2,
    mentor: Users,
    announcement: Megaphone,
    system: FileText,
    career: FileText,
};

const TYPE_LABELS: Record<string, string> = {
    interview: "Interview",
    mentor: "Mentor",
    announcement: "Announcement",
    system: "System",
    career: "Career",
};

interface Notification {
    id: number;
    title: string;
    body: string;
    isRead: boolean;
    type: string;
    link: string | null;
    createdAt: string;
}

function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 60_000) return "Just now";
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
    if (diffMs < 604800_000) return `${Math.floor(diffMs / 86400_000)}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>(initial);
    const [markingAll, setMarkingAll] = useState(false);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleClick = async (n: Notification) => {
        if (!n.isRead) {
            try {
                await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
                setNotifications((prev) =>
                    prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
                );
            } catch {
                // ignore
            }
        }
        if (n.link) router.push(n.link);
    };

    const markAllAsRead = async () => {
        if (markingAll || unreadCount === 0) return;
        setMarkingAll(true);
        try {
            await fetch("/api/notifications/read-all", { method: "PATCH" });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch {
            // ignore
        } finally {
            setMarkingAll(false);
        }
    };

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <BellOff className="size-6 text-muted-foreground" aria-hidden />
                </div>
                <div>
                    <p className="font-medium">You&apos;re all caught up</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        No notifications yet. We&apos;ll let you know when something happens.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Actions row */}
            {unreadCount > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        disabled={markingAll}
                        className="gap-1.5 text-xs"
                    >
                        <CheckCheck className="size-3.5" aria-hidden />
                        Mark all as read
                    </Button>
                </div>
            )}

            {/* List */}
            <ul className="space-y-2">
                {notifications.map((n) => {
                    const Icon = TYPE_ICONS[n.type] ?? FileText;
                    const typeLabel = TYPE_LABELS[n.type] ?? n.type;
                    return (
                        <li key={n.id}>
                            <button
                                type="button"
                                onClick={() => handleClick(n)}
                                className={cn(
                                    "w-full text-left rounded-xl border p-4 transition-colors hover:bg-muted/50 flex gap-4",
                                    !n.isRead ? "bg-muted/30 border-primary/20" : "border-border"
                                )}
                            >
                                {/* Icon */}
                                <div
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                                        !n.isRead ? "bg-primary/10" : "bg-muted"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "size-4",
                                            !n.isRead ? "text-primary" : "text-muted-foreground"
                                        )}
                                        aria-hidden
                                    />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn("text-sm leading-snug", !n.isRead && "font-semibold")}>
                                            {n.title}
                                        </p>
                                        {!n.isRead && (
                                            <span
                                                className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                                                aria-label="Unread"
                                            />
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                        {n.body}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
                                            {typeLabel}
                                        </span>
                                        <span>·</span>
                                        <span>{formatTime(n.createdAt)}</span>
                                    </div>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
