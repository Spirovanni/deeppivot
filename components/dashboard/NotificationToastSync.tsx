"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/src/lib/toast";
import { useNotificationStream } from "@/hooks/useNotificationStream";

/**
 * Component that listens for real-time notifications and displays a toast.
 * Mounted in the dashboard layout.
 */
export default function NotificationToastSync() {
    const lastNotificationId = useRef<number | null>(null);
    const isInitialLoad = useRef(true);

    const checkNewNotifications = async () => {
        try {
            // Fetch only the single latest notification to compare IDs
            const res = await fetch("/api/notifications?limit=1");
            if (!res.ok) return;

            const data = await res.json();
            const latest = data.notifications?.[0];

            if (!latest) return;

            // On initial dashboard mount, we just sync the ID and don't show a toast
            if (isInitialLoad.current) {
                lastNotificationId.current = latest.id;
                isInitialLoad.current = false;
                return;
            }

            // Only show toast if the ID has actually changed (new notification)
            if (latest.id !== lastNotificationId.current) {
                lastNotificationId.current = latest.id;

                // Trigger toast with title and a hint of the body
                toast(latest.title, {
                    icon: '🔔',
                    duration: 5000,
                });
            }
        } catch (error) {
            console.error("[NotificationToastSync] Failed to fetch latest notification:", error);
        }
    };

    // Listen for SSE "notifications-changed" events
    useNotificationStream(checkNewNotifications);

    // Initial check on mount to sync lastNotificationId
    useEffect(() => {
        checkNewNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
