"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createJobApplication } from "@/src/lib/actions/job-applications";
import type { JobColumn } from "./types";

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: number | null;
  columns: JobColumn[];
  userId: number;
}

export function CreateJobDialog({
  open,
  onOpenChange,
  columnId,
  columns,
  userId,
}: CreateJobDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);

  const effectiveColumnId = selectedColumnId ?? columnId;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!effectiveColumnId) return;

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createJobApplication({
        company: formData.get("company") as string,
        position: formData.get("position") as string,
        location: formData.get("location") as string,
        salary: formData.get("salary") as string,
        jobUrl: formData.get("jobUrl") as string,
        tags: formData.get("tags") as string,
        description: formData.get("description") as string,
        notes: formData.get("notes") as string,
        columnId: effectiveColumnId,
        userId,
      });
      onOpenChange(false);
      setSelectedColumnId(null);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Job Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Column selector */}
          <div>
            <Label htmlFor="column">Column</Label>
            <select
              id="column"
              value={effectiveColumnId ?? ""}
              onChange={(e) => setSelectedColumnId(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Company / Position side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input id="company" name="company" required placeholder="Acme Inc." />
            </div>
            <div>
              <Label htmlFor="position">Position *</Label>
              <Input id="position" name="position" required placeholder="Software Engineer" />
            </div>
          </div>

          {/* Location / Salary side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Remote / NYC" />
            </div>
            <div>
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" name="salary" placeholder="$120k - $150k" />
            </div>
          </div>

          <div>
            <Label htmlFor="jobUrl">Job URL</Label>
            <Input id="jobUrl" name="jobUrl" type="url" placeholder="https://..." />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" name="tags" placeholder="remote, frontend, react" />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} placeholder="Job description notes..." />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Personal notes..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
