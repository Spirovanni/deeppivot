"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useClerk, useSession } from "@clerk/nextjs";
import { AlertTriangle } from "lucide-react";

const IDLE_MS = 25 * 60 * 1000;   // 25 minutes idle → show warning
const WARN_MS = 5 * 60 * 1000;    // 5 minutes to respond before auto sign-out

const TRACKED_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

export function SessionTimeoutWarning() {
    const { signOut } = useClerk();
    const { session } = useSession();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(WARN_MS / 1000);
    const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const resetIdle = useCallback(() => {
        if (showWarning) return; // don't reset if modal is open
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => {
            setShowWarning(true);
            setCountdown(WARN_MS / 1000);
        }, IDLE_MS);
    }, [showWarning]);

    // Attach activity listeners
    useEffect(() => {
        if (!session) return;
        TRACKED_EVENTS.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
        resetIdle();
        return () => {
            TRACKED_EVENTS.forEach((e) => window.removeEventListener(e, resetIdle));
            if (idleTimer.current) clearTimeout(idleTimer.current);
        };
    }, [session, resetIdle]);

    // Countdown when warning shown
    useEffect(() => {
        if (!showWarning) {
            if (countdownTimer.current) clearInterval(countdownTimer.current);
            return;
        }
        countdownTimer.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownTimer.current!);
                    signOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (countdownTimer.current) clearInterval(countdownTimer.current); };
    }, [showWarning, signOut]);

    const handleExtend = useCallback(async () => {
        setShowWarning(false);
        setCountdown(WARN_MS / 1000);
        // Touch the session to keep it alive
        try { await session?.touch(); } catch { /* ignore */ }
        resetIdle();
    }, [session, resetIdle]);

    if (!showWarning) return null;

    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Session timeout warning"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <div className="w-full max-w-sm rounded-2xl border bg-card shadow-2xl p-6 text-center space-y-4">
                <div className="flex justify-center">
                    <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="size-6 text-amber-400" />
                    </div>
                </div>
                <div>
                    <h2 className="text-base font-bold mb-1">Session Expiring Soon</h2>
                    <p className="text-sm text-muted-foreground">
                        You&apos;ve been inactive for a while. Your session will end in{" "}
                        <span className="font-semibold text-amber-400 tabular-nums">{timeStr}</span>.
                    </p>
                </div>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => signOut()}
                        className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                    >
                        Sign Out
                    </button>
                    <button
                        onClick={handleExtend}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Continue Session
                    </button>
                </div>
            </div>
        </div>
    );
}
