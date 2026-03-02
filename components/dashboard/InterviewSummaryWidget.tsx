import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, Mic2 } from "lucide-react";

interface InterviewSummaryWidgetProps {
  total: number;
  completed: number;
  hoursPracticed: number;
}

function formatHours(hours: number): string {
  if (hours < 0.1) return "0h";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours}h`;
}

export function InterviewSummaryWidget({ total, completed, hoursPracticed }: InterviewSummaryWidgetProps) {
  return (
    <Link href="/dashboard/interviews">
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Mic2 className="size-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">Interviews</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total === 0
                ? "Practice with AI voice interviews"
                : `${completed} of ${total} interviews completed`}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2">
            <Clock className="size-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {formatHours(hoursPracticed)}
            </span>
            <span className="text-xs text-muted-foreground">practiced</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
