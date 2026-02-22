"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SortableJobCard } from "./SortableJobCard";
import { JobApplicationCard } from "./JobApplicationCard";
import { CreateJobDialog } from "./CreateJobDialog";
import { EditJobDialog } from "./EditJobDialog";
import { COLUMN_COLORS } from "./types";
import { updateJobApplication } from "@/src/lib/actions/job-applications";
import type { JobBoard, JobApplication, JobColumn } from "./types";

interface KanbanBoardProps {
  board: JobBoard;
  userId: number;
}

function DroppableColumn({
  column,
  children,
  onAddJob,
}: {
  column: JobColumn;
  children: React.ReactNode;
  onAddJob: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[300px] shrink-0 flex-col rounded-lg border border-t-4 bg-muted/30 transition-colors ${
        COLUMN_COLORS[column.name] || "border-t-gray-500"
      } ${isOver ? "bg-muted/60 ring-2 ring-primary/20" : ""}`}
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
          onClick={onAddJob}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Job Cards */}
      <div className="flex min-h-[50px] flex-col gap-2 px-2 pb-2">
        {children}
      </div>
    </div>
  );
}

export function KanbanBoard({ board, userId }: KanbanBoardProps) {
  // Optimistic local state for columns/jobs
  const [columns, setColumns] = useState<JobColumn[]>(board.columns);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<number | null>(null);
  const [editJob, setEditJob] = useState<JobApplication | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Sync from server when board prop changes (e.g. after revalidation)
  const boardKey = JSON.stringify(board.columns.map((c) => [c.id, c.jobs.map((j) => j.id + ":" + j.columnId + ":" + j.order)]));
  const [prevBoardKey, setPrevBoardKey] = useState(boardKey);
  if (boardKey !== prevBoardKey) {
    setColumns(board.columns);
    setPrevBoardKey(boardKey);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Find the actively-dragged job for the overlay
  const activeJob = useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const found = col.jobs.find((j) => j.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const handleAddJob = (columnId: number) => {
    setCreateColumnId(columnId);
    setCreateDialogOpen(true);
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeJobId = active.id as number;

    // Determine target column
    let overColumnId: number | null = null;
    if (typeof over.id === "string" && (over.id as string).startsWith("column-")) {
      overColumnId = Number((over.id as string).replace("column-", ""));
    } else {
      // over is a job card — find its column
      for (const col of columns) {
        if (col.jobs.some((j) => j.id === over.id)) {
          overColumnId = col.id;
          break;
        }
      }
    }

    if (overColumnId === null) return;

    // Find source column
    let sourceColumnId: number | null = null;
    for (const col of columns) {
      if (col.jobs.some((j) => j.id === activeJobId)) {
        sourceColumnId = col.id;
        break;
      }
    }

    if (sourceColumnId === null || sourceColumnId === overColumnId) return;

    // Move card between columns optimistically
    setColumns((prev) => {
      const sourceCol = prev.find((c) => c.id === sourceColumnId)!;
      const targetCol = prev.find((c) => c.id === overColumnId)!;

      const jobToMove = sourceCol.jobs.find((j) => j.id === activeJobId)!;
      const movedJob = { ...jobToMove, columnId: overColumnId! };

      return prev.map((col) => {
        if (col.id === sourceColumnId) {
          return { ...col, jobs: col.jobs.filter((j) => j.id !== activeJobId) };
        }
        if (col.id === overColumnId) {
          // Find where to insert
          const overIndex = col.jobs.findIndex((j) => j.id === over.id);
          const newJobs = [...col.jobs];
          if (overIndex >= 0) {
            newJobs.splice(overIndex, 0, movedJob);
          } else {
            newJobs.push(movedJob);
          }
          return { ...col, jobs: newJobs };
        }
        return col;
      });
    });
  }, [columns]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeJobId = active.id as number;

      // Determine target column
      let overColumnId: number | null = null;
      let overJobId: number | null = null;

      if (typeof over.id === "string" && (over.id as string).startsWith("column-")) {
        overColumnId = Number((over.id as string).replace("column-", ""));
      } else {
        overJobId = over.id as number;
        for (const col of columns) {
          if (col.jobs.some((j) => j.id === overJobId)) {
            overColumnId = col.id;
            break;
          }
        }
      }

      if (overColumnId === null) return;

      // Find which column the active job is currently in (after dragOver updates)
      let sourceCol: JobColumn | null = null;
      for (const col of columns) {
        if (col.jobs.some((j) => j.id === activeJobId)) {
          sourceCol = col;
          break;
        }
      }

      if (!sourceCol) return;

      // Same column reorder
      if (sourceCol.id === overColumnId) {
        const oldIndex = sourceCol.jobs.findIndex((j) => j.id === activeJobId);
        const newIndex = overJobId
          ? sourceCol.jobs.findIndex((j) => j.id === overJobId)
          : sourceCol.jobs.length - 1;

        if (oldIndex === newIndex) return;

        const reordered = arrayMove(sourceCol.jobs, oldIndex, newIndex);

        // Optimistic UI update
        setColumns((prev) =>
          prev.map((col) =>
            col.id === overColumnId ? { ...col, jobs: reordered } : col
          )
        );

        // Persist: recalculate order for the moved item
        const newOrder = calculateOrder(reordered, newIndex);
        updateJobApplication(activeJobId, {
          columnId: overColumnId,
          order: newOrder,
        });
      } else {
        // Cross-column move already handled by handleDragOver
        // Just persist the final position
        const targetCol = columns.find((c) => c.id === overColumnId);
        if (!targetCol) return;

        const finalIndex = targetCol.jobs.findIndex((j) => j.id === activeJobId);
        const newOrder = calculateOrder(targetCol.jobs, finalIndex >= 0 ? finalIndex : targetCol.jobs.length - 1);

        updateJobApplication(activeJobId, {
          columnId: overColumnId,
          order: newOrder,
        });
      }
    },
    [columns]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    // Reset to server state on cancel
    setColumns(board.columns);
  }, [board.columns]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ minWidth: columns.length * 300 }}>
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                onAddJob={() => handleAddJob(column.id)}
              >
                <SortableContext
                  items={column.jobs.map((j) => j.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {column.jobs.map((job) => (
                    <SortableJobCard
                      key={job.id}
                      job={job}
                      columns={columns}
                      onEdit={() => setEditJob(job)}
                    />
                  ))}
                </SortableContext>
              </DroppableColumn>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Drag Overlay — rendered outside columns for a floating effect */}
        <DragOverlay>
          {activeJob ? (
            <div className="w-[280px] rotate-2 opacity-90">
              <JobApplicationCard
                job={activeJob}
                columns={columns}
                onEdit={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Dialog */}
      <CreateJobDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        columnId={createColumnId}
        columns={columns}
        userId={userId}
      />

      {/* Edit Dialog */}
      <EditJobDialog
        open={!!editJob}
        onOpenChange={(open) => !open && setEditJob(null)}
        job={editJob}
        columns={columns}
      />
    </>
  );
}

/**
 * Calculate the order value for an item at a given index.
 * Uses +100 spacing between items. If inserting between two items,
 * uses the midpoint to avoid rewriting all orders.
 */
function calculateOrder(jobs: JobApplication[], index: number): number {
  if (jobs.length === 0) return 0;
  if (jobs.length === 1) return jobs[0].order;

  const prev = index > 0 ? jobs[index - 1]?.order : null;
  const next = index < jobs.length - 1 ? jobs[index + 1]?.order : null;

  if (prev !== null && next !== null) {
    // Between two items — use midpoint
    return Math.round((prev + next) / 2);
  }
  if (prev !== null) {
    // Last position
    return prev + 100;
  }
  if (next !== null) {
    // First position
    return Math.max(0, next - 100);
  }
  return index * 100;
}
