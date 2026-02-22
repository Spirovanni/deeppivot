"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, ExternalLink, Plus } from "lucide-react";
import {
  useUpdatePlan,
  useAddResource,
  useRemoveResource,
  type PlanMilestone,
} from "@/src/lib/hooks/use-career-plans";

interface EditMilestoneDialogProps {
  milestone: PlanMilestone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESOURCE_TYPES = ["article", "course", "tool", "video"];

export function EditMilestoneDialog({
  milestone,
  open,
  onOpenChange,
}: EditMilestoneDialogProps) {
  const [addingResource, setAddingResource] = useState(false);
  const updatePlan = useUpdatePlan();
  const addResource = useAddResource();
  const removeResource = useRemoveResource();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    updatePlan.mutate(
      {
        id: milestone.id,
        data: {
          title: fd.get("title") as string,
          description: (fd.get("description") as string) || undefined,
          targetDate: (fd.get("targetDate") as string) || undefined,
          status: (fd.get("status") as string) || "planned",
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const handleAddResource = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    addResource.mutate(
      {
        milestoneId: milestone.id,
        data: {
          title: fd.get("resTitle") as string,
          url: fd.get("resUrl") as string,
          resourceType: (fd.get("resType") as string) || "article",
        },
      },
      {
        onSuccess: () => {
          setAddingResource(false);
          (e.target as HTMLFormElement).reset();
        },
      }
    );
  };

  const handleRemoveResource = (resourceId: number) => {
    removeResource.mutate({ milestoneId: milestone.id, resourceId });
  };

  const toDateInputValue = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  };

  const isPending =
    updatePlan.isPending || addResource.isPending || removeResource.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={milestone.title}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={milestone.description ?? ""}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-targetDate">Target Date</Label>
              <Input
                id="edit-targetDate"
                name="targetDate"
                type="date"
                defaultValue={toDateInputValue(milestone.targetDate)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                name="status"
                defaultValue={milestone.status}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {updatePlan.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>

        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Resources</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAddingResource((v) => !v)}
            >
              <Plus className="mr-1 size-3.5" />
              Add
            </Button>
          </div>

          {milestone.resources.length > 0 && (
            <ul className="mb-3 space-y-2">
              {milestone.resources.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="flex-1 truncate font-medium">{r.title}</span>
                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {r.resourceType}
                  </span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(r.id)}
                    disabled={isPending}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {addingResource && (
            <form
              onSubmit={handleAddResource}
              className="space-y-2 rounded-lg border border-dashed border-border p-3"
            >
              <Input name="resTitle" placeholder="Title" required />
              <Input name="resUrl" placeholder="https://..." type="url" required />
              <div className="flex gap-2">
                <select
                  name="resType"
                  defaultValue="article"
                  className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={addResource.isPending}>
                  {addResource.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
