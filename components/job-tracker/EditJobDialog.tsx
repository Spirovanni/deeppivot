"use client";

import { useTransition } from "react";
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
import { updateJobApplication } from "@/src/lib/actions/job-applications";
import type { JobApplication, JobColumn } from "./types";

interface EditJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobApplication | null;
  columns: JobColumn[];
}

export function EditJobDialog({ open, onOpenChange, job, columns }: EditJobDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!job) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateJobApplication(job.id, {
        company: formData.get("company") as string,
        position: formData.get("position") as string,
        location: formData.get("location") as string,
        salary: formData.get("salary") as string,
        jobUrl: formData.get("jobUrl") as string,
        tags: formData.get("tags") as string,
        description: formData.get("description") as string,
        notes: formData.get("notes") as string,
        columnId: Number(formData.get("columnId")),
      });
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Column selector */}
          <div>
            <Label htmlFor="edit-column">Column</Label>
            <select
              id="edit-column"
              name="columnId"
              defaultValue={job.columnId}
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
              <Label htmlFor="edit-company">Company *</Label>
              <Input id="edit-company" name="company" required defaultValue={job.company} />
            </div>
            <div>
              <Label htmlFor="edit-position">Position *</Label>
              <Input id="edit-position" name="position" required defaultValue={job.position} />
            </div>
          </div>

          {/* Location / Salary side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input id="edit-location" name="location" defaultValue={job.location ?? ""} />
            </div>
            <div>
              <Label htmlFor="edit-salary">Salary</Label>
              <Input id="edit-salary" name="salary" defaultValue={job.salary ?? ""} />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-jobUrl">Job URL</Label>
            <Input id="edit-jobUrl" name="jobUrl" type="url" defaultValue={job.jobUrl ?? ""} />
          </div>

          <div>
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input id="edit-tags" name="tags" defaultValue={job.tags.join(", ")} />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" name="description" rows={2} defaultValue={job.description ?? ""} />
          </div>

          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" name="notes" rows={2} defaultValue={job.notes ?? ""} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
