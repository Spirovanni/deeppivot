import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Mic2, Calendar, HelpCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSessionDetail,
  getSessionEmotions,
  getInterviewFeedback,
  getSessionJobMatchData,
} from "@/src/lib/actions/interview-sessions";
import { EmotionTimeline } from "@/components/interviews/EmotionTimeline";
import { CommunicationSummary } from "@/components/interviews/CommunicationSummary";
import { JobMatchScoreCard } from "@/components/interviews/JobMatchScoreCard";

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

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { sessionId: sessionIdStr } = await params;
  const sessionId = parseInt(sessionIdStr, 10);
  if (isNaN(sessionId)) notFound();

  const [session, snapshots, feedback, jobMatchData] = await Promise.all([
    getSessionDetail(sessionId),
    getSessionEmotions(sessionId),
    getInterviewFeedback(sessionId),
    getSessionJobMatchData(sessionId),
  ]);

  if (!session) notFound();

  const typeLabel = SESSION_TYPE_LABELS[session.sessionType] ?? "General";
  const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.completed;
  const duration = formatDuration(session.startedAt, session.endedAt);

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard/interviews"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All Interviews
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Mic2 className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{typeLabel} Interview</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(session.startedAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {session.endedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {duration}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session.overallScore !== null && (
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-primary">
                  {session.overallScore}%
                </p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            )}
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          </div>
        </div>

        {/* AI Feedback link */}
        {session.status === "completed" && (
          <Link
            href={`/dashboard/interviews/${sessionId}/feedback`}
            className="block"
          >
            <Card className="transition-colors hover:bg-accent/30">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">AI Feedback</p>
                    <p className="text-sm text-muted-foreground">
                      {feedback
                        ? "View structured feedback from your interview"
                        : "Feedback is being generated — check back in a few minutes"}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Job Match Score */}
        {jobMatchData && (
          <JobMatchScoreCard
            jobTitle={jobMatchData.jobTitle}
            companyName={jobMatchData.companyName}
            technicalSkills={jobMatchData.technicalSkills}
            softSkills={jobMatchData.softSkills}
            culture={jobMatchData.culture}
            overallScore={jobMatchData.overallScore}
          />
        )}

        {/* Notes */}
        {session.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{session.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Emotion Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Emotion Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Emotional signals detected throughout your session. Hover bars for details.
            </p>
          </CardHeader>
          <CardContent>
            <EmotionTimeline
              snapshots={snapshots.map((s) => ({
                id: s.id,
                capturedAt: s.capturedAt,
                dominantEmotion: s.dominantEmotion,
                confidence: s.confidence,
              }))}
              sessionStartedAt={session.startedAt}
            />
          </CardContent>
        </Card>

        {/* Communication Style Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Communication Style Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Aggregated emotional intelligence feedback based on {snapshots.length} data
              point{snapshots.length !== 1 ? "s" : ""} captured during the session.
            </p>
          </CardHeader>
          <CardContent>
            <CommunicationSummary
              snapshots={snapshots.map((s) => ({
                dominantEmotion: s.dominantEmotion,
                confidence: s.confidence,
                emotions: s.emotions,
              }))}
              sessionType={session.sessionType}
            />
          </CardContent>
        </Card>

        {/* Questions */}
        {session.questions && session.questions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Questions ({session.questions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {session.questions.map((q, i) => (
                  <li key={q.id} className="flex gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">{q.questionText}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground capitalize">
                          {q.questionCategory}
                        </span>
                        {q.responseQuality !== null && (
                          <span className="text-xs font-medium tabular-nums text-primary">
                            {q.responseQuality}%
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* No emotion data fallback */}
        {snapshots.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <HelpCircle className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No emotion data was captured for this session. This can happen if the
                session ended before any voice messages were exchanged.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
