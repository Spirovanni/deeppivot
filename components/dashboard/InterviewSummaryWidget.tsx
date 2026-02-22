import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Mic2 } from "lucide-react";

interface InterviewSummaryWidgetProps {
  total: number;
  completed: number;
}

export function InterviewSummaryWidget({ total, completed }: InterviewSummaryWidgetProps) {
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
        {total > 0 && (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Retake or start a new interview to improve your skills.
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
