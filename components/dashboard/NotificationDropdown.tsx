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
import { Bell, Loader2, FileText, Mic2, Users, Megaphone } from "lucide-react";
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

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?limit=15");
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount((data.notifications ?? []).filter((n: Notification) => !n.isRead).length);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    useNotificationStream(fetchNotifications);

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
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-5" aria-hidden />
                    {unreadCount > 0 && (
                        <span
                            className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
                            aria-label={`${unreadCount} unread notifications`}
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[min(400px,70vh)] overflow-hidden flex flex-col p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {notifications.length > 0 && (
                        <Link
                            href="/dashboard/notifications"
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setOpen(false)}
                        >
                            View all
                        </Link>
                    )}
                </div>
                <div className="overflow-y-auto flex-1 min-h-0">
                    {loading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {!loading && notifications.length === 0 && (
                        <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                            No notifications yet
                        </p>
                    )}
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
                                                <span className="size-2 shrink-0 rounded-full bg-primary mt-2" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
