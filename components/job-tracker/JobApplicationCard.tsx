"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2, ArrowRight, ExternalLink, Mic2 } from "lucide-react";
import { deleteJobApplication, moveJobApplication } from "@/src/lib/actions/job-applications";
import type { JobApplication, JobColumn } from "./types";

interface JobApplicationCardProps {
  job: JobApplication;
  columns: JobColumn[];
  onEdit: () => void;
}

export function JobApplicationCard({ job, columns, onEdit }: JobApplicationCardProps) {
  const otherColumns = columns.filter((col) => col.id !== job.columnId);

  return (
    <Card className="gap-0 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="truncate text-sm font-semibold">{job.position}</p>
              {job.sourceType === "marketplace" && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shrink-0">
                  ✦ Via DeepPivot
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{job.company}</p>
          </div>

          {/* Vertical dots dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {otherColumns.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Move To
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {otherColumns.map((col) => (
                      <DropdownMenuItem
                        key={col.id}
                        onClick={() => moveJobApplication(job.id, col.id)}
                      >
                        {col.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuItem asChild>
                <a
                  href={`/dashboard/interviews?practice=true&company=${encodeURIComponent(job.company)}&position=${encodeURIComponent(job.position)}`}
                >
                  <Mic2 className="mr-2 h-4 w-4" />
                  Practice for this Job
                </a>
              </DropdownMenuItem>
              {(job.jobUrl || job.sourceType === "marketplace") && (
                <DropdownMenuItem asChild>
                  <a
                    href={
                      job.sourceType === "marketplace" && job.marketplaceJobId
                        ? `/jobs/${job.marketplaceJobId}`
                        : job.jobUrl ?? "#"
                    }
                    target={job.sourceType === "marketplace" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {job.sourceType === "marketplace" ? "View Marketplace Listing" : "View Posting"}
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteJobApplication(job.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Salary + Location footer */}
        {(job.salary || job.location) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {job.location && <span>{job.location}</span>}
            {job.salary && job.location && <span>·</span>}
            {job.salary && <span>{job.salary}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
