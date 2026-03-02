"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { dismissAnnouncement } from "@/src/lib/actions/announcements";
import { Loader2, ArrowLeft, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";

type Props = {
  announcementId: number;
  title: string;
  body: string;
  sendToHome: boolean;
  createdAt: Date;
  userId: number;
};

export function AnnouncementView({ announcementId, title, body, sendToHome, createdAt, userId }: Props) {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  // Automatically dismiss the announcement when the user views this page (deeppivot-259)
  useEffect(() => {
    const autoDismiss = async () => {
      await dismissAnnouncement(userId, announcementId);
    };
    autoDismiss();
  }, [userId, announcementId]);

  const handleBack = async () => {
    setIsDismissing(true);
    router.push("/dashboard");
    router.refresh();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return formatDate(date);
  };

  return (
    <article className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {sendToHome && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Important Update
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {formatRelativeTime(createdAt)}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground balance">
            {title}
          </h1>

          <div className="flex items-center gap-4 py-4 border-y border-border/50 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="size-4 text-primary" />
              </div>
              <span className="font-medium text-foreground">DeepPivot Team</span>
            </div>
            <div className="h-4 w-px bg-border/50" />
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              {formatDate(createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div
        className="prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 rich-text-display mb-12"
        dangerouslySetInnerHTML={{ __html: body }}
      />

      <style jsx global>{`
        .rich-text-display h1 {
          font-size: 1.875rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.2;
          letter-spacing: -0.025em;
        }
        .rich-text-display h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
          letter-spacing: -0.025em;
        }
        .rich-text-display p {
          margin-bottom: 1.25rem;
          line-height: 1.625;
          color: hsl(var(--muted-foreground));
        }
        .rich-text-display ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .rich-text-display ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .rich-text-display li {
          margin-bottom: 0.5rem;
        }
        .rich-text-display b, .rich-text-display strong {
          font-weight: 700;
          color: hsl(var(--foreground));
        }
        .rich-text-display i, .rich-text-display em {
          font-style: italic;
        }
      `}</style>

      <div className="fixed bottom-8 right-8 sm:relative sm:bottom-0 sm:right-0 sm:mt-12">
        <button
          onClick={handleBack}
          disabled={isDismissing}
          className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          {isDismissing ? <Loader2 className="size-4 animate-spin" /> : null}
          {isDismissing ? "Continuing…" : "Continue to Dashboard"}
        </button>
      </div>
    </article>
  );
}
