/**
 * Hook: Subscribe to real-time notification stream via Server-Sent Events.
 * Triggers onRefetch when the server pushes a "notifications-changed" event.
 * Phase 16.3 (deeppivot-244)
 */
"use client";

import { useEffect, useRef, useCallback } from "react";

export function useNotificationStream(onRefetch: () => void) {
    const onRefetchRef = useRef(onRefetch);
    onRefetchRef.current = onRefetch;

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let delay = 2000;
        const maxDelay = 60000;

        const connect = () => {
            try {
                eventSource = new EventSource("/api/notifications/stream");
            } catch {
                scheduleReconnect();
                return;
            }

            eventSource.addEventListener("notifications-changed", () => {
                onRefetchRef.current();
            });

            eventSource.onerror = () => {
                eventSource?.close();
                eventSource = null;
                scheduleReconnect();
            };
        };

        const scheduleReconnect = () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
                delay = Math.min(delay * 1.5, maxDelay);
                connect();
            }, delay);
        };

        connect();

        return () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            eventSource?.close();
        };
    }, []);
}
