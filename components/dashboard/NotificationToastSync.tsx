"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/src/lib/toast";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { useGamificationStore } from "@/src/store/gamification";
import { GAMIFICATION_BADGES } from "@/src/lib/gamification-badges";
import { BADGE_RULES } from "@/src/lib/badge-rules";

const BADGE_UNLOCK_TITLE = "New Achievement Unlocked!";
const BADGE_CELEBRATED_KEY = "deeppivot:celebratedBadges";

function getCelebratedBadges(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
        const raw = localStorage.getItem(BADGE_CELEBRATED_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function markBadgeCelebrated(badgeId: string) {
    if (typeof window === "undefined") return;
    const set = getCelebratedBadges();
    set.add(badgeId);
    localStorage.setItem(BADGE_CELEBRATED_KEY, JSON.stringify([...set]));
}

/** Extract badge ID from notification body like: ...earned the "first-steps" badge: ... */
function extractBadgeId(body: string): string | null {
    const match = body.match(/earned the "([^"]+)" badge/);
    return match?.[1] ?? null;
}

/**
 * Component that listens for real-time notifications and displays a toast.
 * Badge-unlock notifications trigger a celebration modal instead.
 * Mounted in the dashboard layout.
 */
export default function NotificationToastSync() {
    const lastNotificationId = useRef<number | null>(null);
    const isInitialLoad = useRef(true);
    const showBadgeUnlock = useGamificationStore((s) => s.showBadgeUnlock);

    const checkNewNotifications = async () => {
        try {
            const res = await fetch("/api/notifications?limit=1");
            if (!res.ok) return;

            const data = await res.json();
            const latest = data.notifications?.[0];

            if (!latest) return;

            // On initial dashboard mount, sync the ID without showing anything
            if (isInitialLoad.current) {
                lastNotificationId.current = latest.id;
                isInitialLoad.current = false;
                return;
            }

            // Only act if the ID has actually changed (new notification)
            if (latest.id !== lastNotificationId.current) {
                lastNotificationId.current = latest.id;

                // Check if this is a badge-unlock notification
                if (latest.title === BADGE_UNLOCK_TITLE) {
                    const badgeId = extractBadgeId(latest.body ?? "");
                    if (badgeId) {
                        const celebrated = getCelebratedBadges();
                        if (!celebrated.has(badgeId)) {
                            markBadgeCelebrated(badgeId);
                            const badge = GAMIFICATION_BADGES.find((b) => b.id === badgeId);
                            const rule = BADGE_RULES.find((r) => r.id === badgeId);
                            showBadgeUnlock({
                                badgeId,
                                label: badge?.label ?? badgeId,
                                description: rule?.description ?? "You earned a new badge!",
                                iconPath: badge?.path ?? "/badges/first-steps.svg",
                            });
                            return; // Skip the generic toast
                        }
                    }
                }

                toast(latest.title, {
                    icon: "\uD83D\uDD14",
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
