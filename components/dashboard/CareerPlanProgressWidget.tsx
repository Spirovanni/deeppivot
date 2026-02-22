import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MapPin, Printer } from "lucide-react";

interface CareerPlanProgressWidgetProps {
  total: number;
  completed: number;
  inProgress: number;
}

export function CareerPlanProgressWidget({
  total,
  completed,
  inProgress,
}: CareerPlanProgressWidgetProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Link href="/dashboard/career-plan">
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="size-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">Career Plan</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total === 0
                ? "Add milestones to build your roadmap"
                : `${completed} of ${total} milestones completed (${percent}%)`}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </CardHeader>
        {total > 0 && (
          <CardContent className="pt-0">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{total - completed - inProgress} planned</span>
                <span>{inProgress} in progress</span>
                <span>{completed} completed</span>
              </div>
              <Link
                href="/dashboard/career-plan"
                className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Printer className="size-3" />
                Print / Export
              </Link>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
