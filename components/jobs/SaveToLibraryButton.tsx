"use client";

import { useState } from "react";
import { BookOpen, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface SaveToLibraryButtonProps {
  jobId: number;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
}

export function SaveToLibraryButton({
  jobId,
  jobTitle,
  companyName,
  jobDescription,
}: SaveToLibraryButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/job-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle,
          company: companyName,
          content: jobDescription,
          url: `${window.location.origin}/dashboard/jobs/${jobId}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save job description");
      }

      setSaved(true);
      toast.success("Saved to your Practice Library");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm font-medium text-green-600 dark:text-green-400">
          <Check className="size-4" />
          Saved to Practice Library
        </span>
        <Link
          href="/dashboard/practice/job-descriptions"
          className="text-sm text-primary hover:underline"
        >
          View library
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <BookOpen className="size-4" />
      )}
      {loading ? "Saving..." : "Save to Practice Library"}
    </button>
  );
}
