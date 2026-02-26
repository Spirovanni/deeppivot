"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Star, Send, CheckCircle2 } from "lucide-react";

export function FeedbackWidget() {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!rating) return;
        setStatus("loading");
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, message }),
            });
            if (!res.ok) throw new Error("Failed");
            setStatus("success");
            setTimeout(() => { setOpen(false); setStatus("idle"); setRating(0); setMessage(""); }, 2500);
        } catch {
            setStatus("error");
        }
    }

    return (
        <>
            {/* Floating tab - hide on mobile */}
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label="Open feedback"
                className="hidden sm:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 items-center gap-1.5 rounded-l-lg bg-primary px-2.5 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
                <MessageSquarePlus className="size-4 rotate-90" />
                <span className="text-[10px] font-semibold tracking-wide uppercase rotate-180">Feedback</span>
            </button>

            {/* Popover */}
            {open && (
                <div className="fixed right-10 top-1/2 -translate-y-1/2 z-50 w-72 rounded-2xl border bg-card shadow-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold">Share your feedback</h3>
                        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="size-4" />
                        </button>
                    </div>

                    {status === "success" ? (
                        <div className="flex flex-col items-center py-4 gap-2 text-center">
                            <CheckCircle2 className="size-10 text-green-400" />
                            <p className="text-sm font-medium">Thanks for your feedback!</p>
                            <p className="text-xs text-muted-foreground">We read every submission.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Star rating */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">How&apos;s your experience?</p>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHovered(star)}
                                            onMouseLeave={() => setHovered(0)}
                                            aria-label={`Rate ${star} stars`}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`size-7 transition-colors ${star <= (hovered || rating)
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-muted-foreground"
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={3}
                                    placeholder="Tell us what's on your mind (optional)..."
                                    className="w-full rounded-lg border bg-muted/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                />
                            </div>

                            {status === "error" && (
                                <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
                            )}

                            <button
                                type="submit"
                                disabled={!rating || status === "loading"}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                <Send className="size-3" />
                                {status === "loading" ? "Sending..." : "Submit"}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </>
    );
}
