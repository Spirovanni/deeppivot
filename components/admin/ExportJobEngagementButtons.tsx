"use client";

import { useState } from "react";
import { Download, Link2, Loader2 } from "lucide-react";

export function ExportJobEngagementButtons() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [status, setStatus] = useState<"" | "draft" | "published" | "closed">("");

    const downloadUrl = () => {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (status) params.set("status", status);
        return `/api/admin/export/jobs${params.toString() ? `?${params.toString()}` : ""}`;
    };

    const handleGenerateLink = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/admin/export/jobs/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: from || undefined,
                    to: to || undefined,
                    status: status || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to generate link");

            await navigator.clipboard.writeText(data.url);
            window.open(data.url, "_blank", "noopener");
            alert("Secure link copied to clipboard. Download opened in new tab. Link expires in 15 minutes.");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to generate secure link");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">From</span>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="rounded border bg-muted/50 px-2 py-1 text-xs"
                    />
                </label>
                <label className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">To</span>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="rounded border bg-muted/50 px-2 py-1 text-xs"
                    />
                </label>
                <label className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Status</span>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "" | "draft" | "published" | "closed")}
                        className="rounded border bg-muted/50 px-2 py-1 text-xs"
                    >
                        <option value="">All</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="closed">Closed</option>
                    </select>
                </label>
            </div>
            <div className="flex items-center gap-2">
                <a
                    href={downloadUrl()}
                    download
                    className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                    <Download className="size-4" />
                    Download now
                </a>
                <button
                    type="button"
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                    {isGenerating ? "Generating…" : "Secure link"}
                </button>
            </div>
        </div>
    );
}
