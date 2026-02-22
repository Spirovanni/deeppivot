"use client";

import { MapPin, Loader2 } from "lucide-react";
import { useCareerPlans } from "@/src/lib/hooks/use-career-plans";
import { MilestoneTimeline } from "./MilestoneTimeline";

export function CareerPlanClient() {
  const { data: milestones = [], isLoading, error } = useCareerPlans();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Loading career plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="font-medium text-destructive">Failed to load career plan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const inProgressCount = milestones.filter((m) => m.status === "in_progress").length;

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Career Plan
          </h1>
          <p className="mt-1 text-muted-foreground">
            Build your personalized roadmap with draggable milestones and curated
            resources.
          </p>

          {milestones.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">
                  {milestones.length - completedCount - inProgressCount} planned
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  {inProgressCount} in progress
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  {completedCount} completed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {milestones.length > 0 && (
          <div className="mb-8 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                Overall Progress
              </span>
              <span>
                {Math.round((completedCount / milestones.length) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${Math.round((completedCount / milestones.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <MilestoneTimeline milestones={milestones} />
      </div>
    </div>
  );
}
