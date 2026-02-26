"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "dp_cookie_consent";

export type ConsentChoice = "accepted" | "rejected" | null;

export function useCookieConsent(): ConsentChoice {
    const [consent, setConsent] = useState<ConsentChoice>(null);
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as ConsentChoice | null;
        setConsent(stored);
    }, []);
    return consent;
}

export function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) setVisible(true);
    }, []);

    const handleChoice = useCallback((choice: "accepted" | "rejected") => {
        localStorage.setItem(STORAGE_KEY, choice);
        setVisible(false);

        // PostHog opt-in / opt-out — use unknown cast to avoid TS overlap error
        if (typeof window !== "undefined") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as unknown as Record<string, any>;
            if (win.posthog) {
                if (choice === "accepted") win.posthog.opt_in_capturing?.();
                else win.posthog.opt_out_capturing?.();
            }
        }
    }, []);


    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-border bg-background/95 backdrop-blur-md px-4 py-4 sm:px-6 shadow-2xl"
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-0.5">🍪 Cookie Preferences</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    We use essential cookies for authentication and optional analytics cookies (PostHog) to improve DeepPivot.{" "}
                    <a href="/privacy" className="underline text-primary hover:opacity-80">Privacy Policy</a>
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={() => handleChoice("rejected")}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors"
                >
                    Essential Only
                </button>
                <button
                    onClick={() => handleChoice("accepted")}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                    Accept All
                </button>
                <button
                    onClick={() => setVisible(false)}
                    aria-label="Close cookie banner"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}
