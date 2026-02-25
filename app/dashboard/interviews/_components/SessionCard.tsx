"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic2, Clock, ArrowRight, Trash2 } from "lucide-react";
import { deleteInterviewSession } from "../actions";
import { toast } from "@/src/lib/toast";
import { useState } from "react";

const SESSION_TYPE_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  general: "General",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  abandoned: { label: "Abandoned", variant: "destructive" },
};

function formatDuration(startedAt: Date, endedAt: Date | null): string | null {
  if (!endedAt) return null; // Don't calculate duration for active sessions
  const diffMs = endedAt.getTime() - startedAt.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const secs = Math.floor((diffMs % 60_000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

interface SessionCardProps {
  session: {
    id: number;
    sessionType: string;
    status: string;
    startedAt: Date;
    endedAt: Date | null;
    overallScore: number | null;
  };
  isEditMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function SessionCard({
  session,
  isEditMode = false,
  isSelected = false,
  onToggleSelect
}: SessionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.completed;
  const typeLabel = SESSION_TYPE_LABELS[session.sessionType] ?? "General";
  const duration = formatDuration(session.startedAt, session.endedAt);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to session detail page
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this interview session?")) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteInterviewSession(session.id);

    if (result.success) {
      toast.success("Interview session deleted");
    } else {
      toast.error("Failed to delete interview session");
      setIsDeleting(false);
    }
  };

  const cardContent = (
    <Card
      className={`transition-all ${
        isEditMode
          ? isSelected
            ? "border-primary bg-primary/5"
            : "hover:border-muted-foreground/30"
          : "hover:bg-accent/30 hover:shadow-sm"
      }`}
    >
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          {isEditMode && onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              onClick={(e) => e.stopPropagation()}
              className="size-5 cursor-pointer rounded border-gray-300"
            />
          )}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Mic2 className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{typeLabel} Interview</p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span suppressHydrationWarning>
                {new Date(session.startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              {duration && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {duration}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session.overallScore !== null && (
            <span className="text-sm font-semibold tabular-nums">
              {session.overallScore}%
            </span>
          )}
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          {!isEditMode && (
            <>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                aria-label="Delete interview"
              >
                <Trash2 className="size-4" />
              </button>
              <ArrowRight className="size-4 text-muted-foreground" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isEditMode) {
    return (
      <div
        onClick={onToggleSelect}
        className="cursor-pointer"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/dashboard/interviews/${session.id}`}>
      {cardContent}
    </Link>
  );
}
