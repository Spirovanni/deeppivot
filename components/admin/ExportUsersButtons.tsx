"use client";

import { useState } from "react";
import { Download, Link2, Loader2 } from "lucide-react";

export function ExportUsersButtons() {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateLink = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/admin/export/users/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ includeDeleted: false }),
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
        <div className="flex items-center gap-2">
            <a
                href="/api/admin/export/users"
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
    );
}
