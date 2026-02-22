"use client";

import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { JobApplicationCard } from "./JobApplicationCard";
import { CreateJobDialog } from "./CreateJobDialog";
import { EditJobDialog } from "./EditJobDialog";
import { COLUMN_COLORS } from "./types";
import type { JobBoard, JobApplication, JobColumn } from "./types";

interface KanbanBoardProps {
  board: JobBoard;
  userId: number;
}

export function KanbanBoard({ board, userId }: KanbanBoardProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<number | null>(null);
  const [editJob, setEditJob] = useState<JobApplication | null>(null);

  const handleAddJob = (columnId: number) => {
    setCreateColumnId(columnId);
    setCreateDialogOpen(true);
  };

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4" style={{ minWidth: board.columns.length * 300 }}>
          {board.columns.map((column) => (
            <div
              key={column.id}
              className={`flex w-[300px] shrink-0 flex-col rounded-lg border border-t-4 bg-muted/30 ${COLUMN_COLORS[column.name] || "border-t-gray-500"}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{column.name}</h3>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                    {column.jobs.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleAddJob(column.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Job Cards */}
              <div className="flex flex-col gap-2 px-2 pb-2">
                {column.jobs.map((job) => (
                  <JobApplicationCard
                    key={job.id}
                    job={job}
                    columns={board.columns}
                    onEdit={() => setEditJob(job)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Create Dialog */}
      <CreateJobDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        columnId={createColumnId}
        columns={board.columns}
        userId={userId}
      />

      {/* Edit Dialog */}
      <EditJobDialog
        open={!!editJob}
        onOpenChange={(open) => !open && setEditJob(null)}
        job={editJob}
        columns={board.columns}
      />
    </>
  );
}
