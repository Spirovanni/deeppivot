"use client";

import { MapPin, Calendar, BookOpen, CheckCircle2, Circle, Clock } from "lucide-react";
import type { PlanMilestone } from "@/src/lib/hooks/use-career-plans";
import { cn } from "@/utils";

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
};

interface CareerPlanPrintableProps {
  milestones: PlanMilestone[];
}

export function CareerPlanPrintable({ milestones }: CareerPlanPrintableProps) {
    const completedCount = milestones.filter((m) => m.status === "completed").length;
    const inProgressCount = milestones.filter((m) => m.status === "in_progress").length;

  return (
    <div className="career-plan-printable bg-white p-8 text-black">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Career Plan</h1>
          <p className="mt-1 text-sm text-gray-600">
            Build your personalized roadmap with milestones and curated resources.
          </p>

          {milestones.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                {milestones.length - completedCount - inProgressCount} planned
              </span>
              <span>{inProgressCount} in progress</span>
              <span>{completedCount} completed</span>
            </div>
          )}
        </div>

        {milestones.length > 0 && (
          <div className="mb-8 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                Overall Progress
              </span>
              <span>{Math.round((completedCount / milestones.length) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500"
                style={{
                  width: `${Math.round((completedCount / milestones.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {milestones.length === 0 ? (
            <p className="text-gray-500">No milestones yet.</p>
          ) : (
            milestones.map((milestone, idx) => {
              const isCompleted = milestone.status === "completed";
              const targetDate = milestone.targetDate
                ? new Date(milestone.targetDate)
                : null;

              return (
                <div
                  key={milestone.id}
                  className="flex gap-3 border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "mt-1 size-3 shrink-0 rounded-full",
                        isCompleted ? "bg-green-500" : "bg-gray-400"
                      )}
                    />
                    {idx < milestones.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-gray-200" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p
                        className={cn(
                          "font-semibold",
                          isCompleted && "line-through text-gray-500"
                        )}
                      >
                        {milestone.title}
                      </p>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          milestone.status === "completed" &&
                            "bg-green-100 text-green-800",
                          milestone.status === "in_progress" &&
                            "bg-blue-100 text-blue-800",
                          milestone.status === "planned" &&
                            "bg-gray-100 text-gray-700"
                        )}
                      >
                        {milestone.status === "completed" && (
                          <CheckCircle2 className="mr-1 inline size-3" />
                        )}
                        {milestone.status === "in_progress" && (
                          <Clock className="mr-1 inline size-3" />
                        )}
                        {milestone.status === "planned" && (
                          <Circle className="mr-1 inline size-3" />
                        )}
                        {STATUS_LABELS[milestone.status] ?? milestone.status}
                      </span>
                    </div>

                    {milestone.description && (
                      <p
                        className={cn(
                          "mt-1 text-sm text-gray-600",
                          isCompleted && "line-through text-gray-400"
                        )}
                      >
                        {milestone.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
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

                    {milestone.resources.length > 0 && (
                      <ul className="mt-2 space-y-1 pl-4">
                        {milestone.resources.map((r) => (
                          <li key={r.id} className="text-xs text-gray-600">
                            <a
                              href={r.url}
                              className="text-blue-600 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {r.title}
                            </a>{" "}
                            <span className="text-gray-400">({r.resourceType})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      <p className="mt-8 text-xs text-gray-400">
        Generated from DeepPivot · {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
