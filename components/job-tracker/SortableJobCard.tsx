"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { JobApplicationCard } from "./JobApplicationCard";
import type { JobApplication, JobColumn } from "./types";

interface SortableJobCardProps {
  job: JobApplication;
  columns: JobColumn[];
  onEdit: () => void;
}

export function SortableJobCard({ job, columns, onEdit }: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobApplicationCard job={job} columns={columns} onEdit={onEdit} />
    </div>
  );
}
