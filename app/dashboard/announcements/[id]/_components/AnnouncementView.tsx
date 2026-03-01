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
      <div className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{body}</div>
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
