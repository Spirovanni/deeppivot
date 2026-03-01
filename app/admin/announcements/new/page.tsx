"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewAnnouncementPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [sendToHome, setSendToHome] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setError("");
        setIsSaving(true);

        try {
            const res = await fetch("/api/admin/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), body: body.trim() || title.trim(), sendToHome }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create announcement");
            }

            router.push("/admin/announcements");
            router.refresh();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred.");
            }
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/announcements"
                    className="flex items-center justify-center size-8 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                    <ArrowLeft className="size-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">New Announcement</h1>
                    <p className="text-sm text-muted-foreground">
                        Broadcast a system announcement to all users (in-app notification).
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1">
                        Title *
                    </label>
                    <input
                        id="title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="e.g. System maintenance scheduled"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="sendToHome"
                        type="checkbox"
                        checked={sendToHome}
                        onChange={(e) => setSendToHome(e.target.checked)}
                        className="rounded border bg-background"
                    />
                    <label htmlFor="sendToHome" className="text-sm font-medium">
                        Send to Home — Force redirect users to this announcement when they visit the dashboard (until dismissed)
                    </label>
                </div>

                <div>
                    <label htmlFor="body" className="block text-sm font-medium mb-1">
                        Message *
                    </label>
                    <textarea
                        id="body"
                        required
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={5}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        placeholder="Enter the announcement message..."
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                        {isSaving ? "Broadcasting…" : "Broadcast"}
                    </button>
                    <Link
                        href="/admin/announcements"
                        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
