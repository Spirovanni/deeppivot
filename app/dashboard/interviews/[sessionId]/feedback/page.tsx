import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSessionDetail,
  getInterviewFeedback,
  getEmotionalAnalysis,
} from "@/src/lib/actions/interview-sessions";
import { AnimatedFeedbackContent } from "@/components/interviews/AnimatedFeedbackContent";
import { EmotionAwareTimeline } from "@/components/interviews/EmotionAwareTimeline";

const SESSION_TYPE_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  general: "General",
};

interface FeedbackPageProps {
  params: { sessionId: string };
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const sessionId = parseInt(params.sessionId, 10);
  if (isNaN(sessionId)) notFound();

  const [session, feedback, emotionalAnalysis] = await Promise.all([
    getSessionDetail(sessionId),
    getInterviewFeedback(sessionId),
    getEmotionalAnalysis(sessionId),
  ]);

  if (!session) notFound();

  const typeLabel = SESSION_TYPE_LABELS[session.sessionType] ?? "General";

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/dashboard/interviews/${sessionId}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Session
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <MessageSquare className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Feedback — {typeLabel} Interview</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {new Date(session.startedAt).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {emotionalAnalysis?.data ? (
          (emotionalAnalysis.data as { unavailable?: boolean }).unavailable ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Emotional Tone Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Emotion analysis is unavailable for this session. Voice emotion
                  analysis could not be performed, but feedback was generated from
                  your transcript.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Emotional Tone Timeline
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Voice emotion analysis from your interview recording.
                </p>
              </CardHeader>
              <CardContent>
                <EmotionAwareTimeline
                  snapshots={
                    (emotionalAnalysis.data as { snapshots?: Array<{ startTime: number; endTime: number; dominantEmotion: string; dominantScore: number }> })
                      .snapshots ?? []
                  }
                  aggregateEmotions={
                    (emotionalAnalysis.data as { aggregateEmotions?: Array<{ name: string; score: number }> })
                      .aggregateEmotions ?? []
                  }
                  overallDominantEmotion={
                    (emotionalAnalysis.data as { overallDominantEmotion?: string })
                      .overallDominantEmotion ?? "neutral"
                  }
                />
              </CardContent>
            </Card>
          )
        ) : null}

        {feedback ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Structured Feedback</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-generated feedback based on your transcript and emotional analysis.
              </p>
            </CardHeader>
            <CardContent>
              <AnimatedFeedbackContent
                content={feedback.content}
                dominantEmotion={
                  emotionalAnalysis?.data &&
                  !(emotionalAnalysis.data as { unavailable?: boolean }).unavailable
                    ? (emotionalAnalysis.data as { overallDominantEmotion?: string })
                        .overallDominantEmotion
                    : undefined
                }
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="size-10 animate-spin text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Feedback is being generated</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your interview recording is being processed. AI feedback typically
                  appears within a few minutes. Check back soon.
                </p>
              </div>
              <Link
                href={`/dashboard/interviews/${sessionId}`}
                className="text-sm text-primary hover:underline"
              >
                Return to session details
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
