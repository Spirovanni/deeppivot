import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/src/db";
import { interviewSessionsTable, usersTable } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { Mic2, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartInterviewCTA } from "./_components/StartInterviewCTA";

const SESSION_TYPE_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  general: "General",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  abandoned: { label: "Abandoned", variant: "destructive" },
};

function formatDuration(startedAt: Date, endedAt: Date | null): string {
  const end = endedAt ?? new Date();
  const diffMs = end.getTime() - startedAt.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const secs = Math.floor((diffMs % 60_000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default async function InterviewsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/sign-in");

  const sessions = await db
    .select()
    .from(interviewSessionsTable)
    .where(eq(interviewSessionsTable.userId, dbUser.id))
    .orderBy(desc(interviewSessionsTable.createdAt))
    .limit(20);

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Interviews</h1>
          <p className="mt-1 text-muted-foreground">
            Practice with AI voice interviews and receive real-time emotion feedback.
          </p>
        </div>

        <StartInterviewCTA />

        {sessions.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">
              Past Sessions{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({sessions.length})
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {sessions.map((session) => {
                const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.completed;
                const typeLabel = SESSION_TYPE_LABELS[session.sessionType] ?? "General";
                const duration = formatDuration(session.startedAt, session.endedAt);

                return (
                  <Link
                    key={session.id}
                    href={`/dashboard/interviews/${session.id}`}
                  >
                    <Card className="transition-all hover:bg-accent/30 hover:shadow-sm">
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Mic2 className="size-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{typeLabel} Interview</p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {new Date(session.startedAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                              {session.endedAt && (
                                <>
                                  <span className="opacity-40">·</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {duration}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {session.overallScore !== null && (
                            <span className="text-sm font-semibold tabular-nums">
                              {session.overallScore}%
                            </span>
                          )}
                          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Mic2 className="size-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No sessions yet — pick an interview type above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
