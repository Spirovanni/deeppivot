import Link from "next/link";
import { Mic2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentSession } from "@/src/lib/actions/dashboard";

const SESSION_TYPE_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  general: "General",
};

interface RecentInterviewsWidgetProps {
  sessions: RecentSession[];
}

export function RecentInterviewsWidget({ sessions }: RecentInterviewsWidgetProps) {
  if (sessions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Interviews</CardTitle>
        <Link
          href="/dashboard/interviews"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          View all
          <ArrowRight className="ml-0.5 inline size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {sessions.map((session) => {
            const typeLabel = SESSION_TYPE_LABELS[session.sessionType] ?? "General";
            return (
              <li key={session.id}>
                <Link
                  href={`/dashboard/interviews/${session.id}`}
                  className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition-colors hover:border-border hover:bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Mic2 className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{typeLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.startedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {session.overallScore !== null && (
                    <Badge variant="secondary" className="shrink-0">
                      {session.overallScore}%
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
