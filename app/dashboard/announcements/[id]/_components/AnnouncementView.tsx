"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dismissAnnouncement } from "@/src/lib/actions/announcements";
import { Loader2 } from "lucide-react";

type Props = {
  announcementId: number;
  title: string;
  body: string;
  sendToHome: boolean;
  userId: number;
};

export function AnnouncementView({ announcementId, title, body, sendToHome, userId }: Props) {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  const handleContinue = async () => {
    setIsDismissing(true);
    await dismissAnnouncement(userId, announcementId);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      {sendToHome && (
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          System Announcement
        </p>
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
      <div
        className="mt-4 text-sm text-muted-foreground rich-text-display"
        dangerouslySetInnerHTML={{ __html: body }}
      />

      <style jsx global>{`
        .rich-text-display h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.25;
          color: var(--foreground);
        }
        .rich-text-display h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          line-height: 1.25;
          color: var(--foreground);
        }
        .rich-text-display p {
          margin-bottom: 0.5rem;
        }
        .rich-text-display ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-display ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-display b, .rich-text-display strong {
          font-weight: 700;
          color: var(--foreground);
        }
        .rich-text-display i, .rich-text-display em {
          font-style: italic;
        }
      `}</style>
      <div className="mt-6 flex gap-2">
        <button
          onClick={handleContinue}
          disabled={isDismissing}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {isDismissing ? <Loader2 className="size-4 animate-spin" /> : null}
          {isDismissing ? "Continuing…" : "Continue to Dashboard"}
        </button>
      </div>
    </div>
  );
}
