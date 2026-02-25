"use client";

import { useState } from "react";
import { SessionCard } from "./SessionCard";
import { deleteInterviewSessions } from "../actions";
import { toast } from "@/src/lib/toast";
import { Trash2, Edit3, X } from "lucide-react";

interface Session {
  id: number;
  sessionType: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  overallScore: number | null;
}

interface SessionsListProps {
  sessions: Session[];
}

export function SessionsList({ sessions }: SessionsListProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleEdit = () => {
    setIsEditMode(!isEditMode);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error("No sessions selected");
      return;
    }

    const count = selectedIds.size;
    const message =
      count === 1
        ? "Are you sure you want to delete this session?"
        : `Are you sure you want to delete ${count} sessions?`;

    if (!confirm(message)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteInterviewSessions(Array.from(selectedIds));

    if (result.success) {
      toast.success(`Successfully deleted ${count} session${count > 1 ? "s" : ""}`);
      setSelectedIds(new Set());
      setIsEditMode(false);
    } else {
      toast.error(result.error || "Failed to delete sessions");
    }
    setIsDeleting(false);
  };

  const allSelected = sessions.length > 0 && selectedIds.size === sessions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < sessions.length;

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Past Sessions{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({sessions.length})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode && selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Delete {selectedIds.size === 1 ? "Session" : `${selectedIds.size} Sessions`}
            </button>
          )}
          <button
            onClick={handleToggleEdit}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            {isEditMode ? (
              <>
                <X className="size-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit3 className="size-4" />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {isEditMode && sessions.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someSelected;
                }
              }}
              onChange={handleSelectAll}
              className="size-4 cursor-pointer rounded border-gray-300"
            />
            <span className="font-medium">
              {allSelected
                ? "Deselect All"
                : someSelected
                ? `${selectedIds.size} Selected`
                : "Select All"}
            </span>
          </label>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            isEditMode={isEditMode}
            isSelected={selectedIds.has(session.id)}
            onToggleSelect={() => handleToggleSelect(session.id)}
          />
        ))}
      </div>
    </div>
  );
}
