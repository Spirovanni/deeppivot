"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GripVertical,
  Calendar,
  BookOpen,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils";
import {
  useDeletePlan,
  useReorderPlans,
  useUpdatePlan,
  type PlanMilestone,
} from "@/src/lib/hooks/use-career-plans";
import { EditMilestoneDialog } from "./EditMilestoneDialog";
import { CreateMilestoneDialog } from "./CreateMilestoneDialog";
import { useShowPointsAnimation } from "@/src/store/gamification";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    icon: React.ElementType;
    dot: string;
  }
> = {
  planned: {
    label: "Planned",
    variant: "outline",
    icon: Circle,
    dot: "bg-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    variant: "default",
    icon: Clock,
    dot: "bg-primary",
  },
  completed: {
    label: "Completed",
    variant: "secondary",
    icon: CheckCircle2,
    dot: "bg-green-500",
  },
};

// ─── Sortable milestone card ───────────────────────────────────────────────────

function SortableMilestoneCard({
  milestone,
  isLast,
}: {
  milestone: PlanMilestone;
  isLast: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const deletePlan = useDeletePlan();
  const updatePlan = useUpdatePlan();
  const showPoints = useShowPointsAnimation();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const statusCfg = STATUS_CONFIG[milestone.status] ?? STATUS_CONFIG.planned;
  const StatusIcon = statusCfg.icon;

  const handleDelete = () => {
    if (!confirm(`Delete "${milestone.title}"?`)) return;
    deletePlan.mutate(milestone.id);
  };

  const handleToggleComplete = () => {
    const nextStatus =
      milestone.status === "completed" ? "planned" : "completed";
    updatePlan.mutate(
      { id: milestone.id, data: { status: nextStatus } },
      {
        onSuccess: (data) => {
          if (data?.pointsAwarded) {
            showPoints(data.pointsAwarded, "Milestone completed");
          }
        },
      }
    );
  };

  const targetDate = milestone.targetDate
    ? new Date(milestone.targetDate)
    : null;

  return (
    <>
      <div ref={setNodeRef} style={style} className="flex gap-3">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={handleToggleComplete}
            disabled={updatePlan.isPending}
            className={cn(
              "mt-3.5 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
              milestone.status === "completed"
                ? "text-green-500 hover:bg-green-500/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label={
              milestone.status === "completed"
                ? "Mark as not complete"
                : "Mark as complete"
            }
          >
            {milestone.status === "completed" ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <Circle className="size-5" strokeWidth={2} />
            )}
          </button>
          {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
        </div>

        <Card
          className={cn("mb-4 flex-1 transition-shadow", isDragging && "shadow-lg")}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <button
                className="mt-0.5 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
              >
                <GripVertical className="size-4" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p
                    className={cn(
                      "font-semibold leading-snug",
                      milestone.status === "completed" && "line-through text-muted-foreground"
                    )}
                  >
                    {milestone.title}
                  </p>
                  <Badge
                    variant={statusCfg.variant}
                    className="shrink-0 gap-1 text-xs"
                  >
                    <StatusIcon className="size-3" />
                    {statusCfg.label}
                  </Badge>
                </div>

                {milestone.description && (
                  <p
                    className={cn(
                      "mt-1 line-clamp-2 text-sm text-muted-foreground",
                      milestone.status === "completed" && "line-through text-muted-foreground/70"
                    )}
                  >
                    {milestone.description}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {targetDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {targetDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  {milestone.resources.length > 0 && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3" />
                      {milestone.resources.length} resource
                      {milestone.resources.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deletePlan.isPending}
                >
                  {deletePlan.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditMilestoneDialog
        milestone={milestone}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

// ─── Main timeline ─────────────────────────────────────────────────────────────

interface MilestoneTimelineProps {
  milestones: PlanMilestone[];
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const reorderPlans = useReorderPlans();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = milestones.findIndex((m) => m.id === active.id);
    const newIdx = milestones.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(milestones, oldIdx, newIdx);

    reorderPlans.mutate(reordered.map((m) => m.id));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {milestones.length} milestone{milestones.length !== 1 ? "s" : ""} ·{" "}
            {milestones.filter((m) => m.status === "completed").length} completed
            {milestones.length >= 2 && (
              <span className="ml-2 text-muted-foreground/70">
                · Drag to reorder
              </span>
            )}
          </p>
        </div>
        <CreateMilestoneDialog />
      </div>

      {milestones.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Calendar className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No milestones yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first career milestone to start building your roadmap.
            </p>
          </div>
          <CreateMilestoneDialog />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={milestones.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {milestones.map((milestone, idx) => (
                <SortableMilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  isLast={idx === milestones.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
