"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { generateFeedbackIfMissing } from "@/src/lib/actions/interview-sessions";

interface RegenerateFeedbackButtonProps {
  sessionId: number;
}

export function RegenerateFeedbackButton({ sessionId }: RegenerateFeedbackButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRetry() {
    setLoading(true);
    try {
      await generateFeedbackIfMissing(sessionId);
      router.refresh();
    } catch (err) {
      console.error("Failed to regenerate feedback:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
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
  );
}
