"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import { generateFeedbackIfMissing } from "@/src/lib/actions/interview-sessions";

interface RegenerateFeedbackButtonProps {
  sessionId: number;
  className?: string;
}

export function RegenerateFeedbackButton({ sessionId, className }: RegenerateFeedbackButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRetry() {
    setLoading(true);
    setError(null);
    try {
      await generateFeedbackIfMissing(sessionId);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate feedback. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleRetry}
        disabled={loading}
        className={
          className ??
          "flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        }
      >
        {loading ? (
          <>
            <RefreshCw className="size-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <RefreshCw className="size-4" />
            Regenerate feedback
          </>
        )}
      </button>
    </div>
  );
}
