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
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                AI Interview Coach
              </h1>
              <p className="mt-2 text-muted-foreground">
                Practice with Sarah, your AI interview coach powered by ElevenLabs.
                Get real-time feedback and build confidence through realistic voice conversations.
              </p>
            </div>
            <div className="hidden rounded-full bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/20 p-4 md:block">
              <Mic2 className="size-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border/50 bg-card/50 p-4">
            <div className="mb-2 text-2xl">🎙️</div>
            <h3 className="font-semibold">Natural Conversations</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Practice with realistic voice interactions, just like a real interview
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/50 p-4">
            <div className="mb-2 text-2xl">💡</div>
            <h3 className="font-semibold">Smart Feedback</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Receive constructive feedback on your responses and interview techniques
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/50 p-4">
            <div className="mb-2 text-2xl">📈</div>
            <h3 className="font-semibold">Track Progress</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Review past sessions and see your improvement over time
            </p>
          </div>
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
          <div className="mt-12 space-y-6">
            {/* First time user tips */}
            <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <span className="text-xl">💡</span>
                Tips for Your First Interview
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3">
                  <span className="text-2xl">🎧</span>
                  <div>
                    <p className="text-sm font-medium">Use Headphones</p>
                    <p className="text-xs text-muted-foreground">
                      For the best audio experience and to avoid feedback
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-sm font-medium">Be Specific</p>
                    <p className="text-xs text-muted-foreground">
                      Use the STAR method for behavioral questions
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">🗣️</span>
                  <div>
                    <p className="text-sm font-medium">Speak Clearly</p>
                    <p className="text-xs text-muted-foreground">
                      Take your time and articulate your thoughts
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-sm font-medium">Take Notes</p>
                    <p className="text-xs text-muted-foreground">
                      Review feedback after each session to improve
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Mic2 className="size-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Ready to practice? Choose an interview type above to begin your session with Sarah.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
