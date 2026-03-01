"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, FileText, Mic2, Users, Megaphone, BellOff, CheckCheck } from "lucide-react";
import { cn } from "@/utils";

const TYPE_ICONS: Record<string, React.ElementType> = {
    interview: Mic2,
    mentor: Users,
    announcement: Megaphone,
    system: FileText,
    career: FileText,
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

export function NotificationDropdown() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications/unread-count");
            if (!res.ok) return;
            const data = await res.json();
            setUnreadCount(data.unreadCount ?? 0);
        } catch {
            // ignore
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?limit=15");
            if (!res.ok) return;
            const data = await res.json();
            const items: Notification[] = data.notifications ?? [];
            setNotifications(items);
            setUnreadCount(items.filter((n) => !n.isRead).length);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    useNotificationStream(() => {
        fetchUnreadCount();
        if (open) fetchNotifications();
    });

    const markAsRead = async (id: number, link: string | null) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
            setOpen(false);
            if (link) router.push(link);
        } catch {
            if (link) router.push(link);
            setOpen(false);
        }
    };

    const markAllAsRead = async () => {
        if (markingAll) return;
        setMarkingAll(true);
        try {
            await fetch("/api/notifications/read-all", { method: "PATCH" });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // ignore
        } finally {
            setMarkingAll(false);
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        if (diffMs < 60_000) return "Just now";
        if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
        if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
                    <Bell className="size-5" aria-hidden />
                    {unreadCount > 0 && (
                        <span
                            className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-background"
                            aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 max-h-[min(440px,75vh)] overflow-hidden flex flex-col p-0"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                disabled={markingAll}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                aria-label="Mark all as read"
                            >
                                <CheckCheck className="size-3.5" />
                                <span>Mark all read</span>
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <Link
                                href="/dashboard/notifications"
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                View all
                            </Link>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 min-h-0">
                    {/* Loading skeleton */}
                    {loading && (
                        <div className="divide-y">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex gap-3 px-4 py-3">
                                    <Skeleton className="size-4 shrink-0 mt-0.5 rounded" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-3/4 rounded" />
                                        <Skeleton className="h-3 w-full rounded" />
                                        <Skeleton className="h-2.5 w-1/3 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && notifications.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                <BellOff className="size-5 text-muted-foreground" aria-hidden />
                            </div>
                            <p className="text-sm font-medium">You&apos;re all caught up</p>
                            <p className="text-xs text-muted-foreground">
                                No notifications yet. We&apos;ll let you know when something happens.
                            </p>
                        </div>
                    )}

                    {/* Notification list */}
                    {!loading && notifications.length > 0 && (
                        <ul className="divide-y">
                            {notifications.map((n) => {
                                const Icon = TYPE_ICONS[n.type] ?? FileText;
                                return (
                                    <li key={n.id}>
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex gap-3",
                                                !n.isRead && "bg-muted/30"
                                            )}
                                            onClick={() => markAsRead(n.id, n.link)}
                                        >
                                            <Icon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                    {n.body}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {formatTime(n.createdAt)}
                                                </p>
                                            </div>
                                            {!n.isRead && (
                                                <span className="size-2 shrink-0 rounded-full bg-primary mt-2" aria-hidden />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Footer — View All link when there are notifications */}
                {!loading && notifications.length > 0 && (
                    <div className="border-t px-4 py-2.5 shrink-0">
                        <Link
                            href="/dashboard/notifications"
                            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            View all notifications
                        </Link>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
