import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/src/db";
import {
  interviewSessionsTable,
  emotionSnapshotsTable,
  usersTable,
} from "@/src/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { expressionColors, isExpressionColor } from "@/utils/expressionColors";
import { expressionLabels } from "@/utils/expressionLabels";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mic2, TrendingUp, Brain, Award, BarChart3 } from "lucide-react";
import { SessionsChart } from "@/components/analytics/SessionsChart";
import { ScoreTrendChart } from "@/components/analytics/ScoreTrendChart";
import { EmotionPieChart } from "@/components/analytics/EmotionPieChart";
import { SkillsRadar } from "@/components/analytics/SkillsRadar";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  general: "General",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/sign-in");

  // ── Fetch raw data ──────────────────────────────────────────────────────────
  const sessions = await db
    .select({
      id: interviewSessionsTable.id,
      sessionType: interviewSessionsTable.sessionType,
      status: interviewSessionsTable.status,
      overallScore: interviewSessionsTable.overallScore,
      startedAt: interviewSessionsTable.startedAt,
    })
    .from(interviewSessionsTable)
    .where(eq(interviewSessionsTable.userId, dbUser.id))
    .orderBy(asc(interviewSessionsTable.startedAt));

  const userSessionIds = sessions.map((s) => s.id);

  const snapshots =
    userSessionIds.length > 0
      ? await db
          .select({
            dominantEmotion: emotionSnapshotsTable.dominantEmotion,
            sessionId: emotionSnapshotsTable.sessionId,
          })
          .from(emotionSnapshotsTable)
          .where(inArray(emotionSnapshotsTable.sessionId, userSessionIds))
      : [];

  // ── Summary stats (LP5.7) ───────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const scoredSessions = completedSessions.filter((s) => s.overallScore !== null);

  const avgScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((acc, s) => acc + s.overallScore!, 0) /
            scoredSessions.length
        )
      : null;

  const typeCounts: Record<string, number> = {};
  for (const s of sessions) {
    typeCounts[s.sessionType] = (typeCounts[s.sessionType] ?? 0) + 1;
  }
  const mostPracticedType =
    Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  const emotionCounts: Record<string, number> = {};
  for (const s of snapshots) {
    emotionCounts[s.dominantEmotion] = (emotionCounts[s.dominantEmotion] ?? 0) + 1;
  }
  const dominantEmotion =
    Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  // ── Weekly sessions data (LP5.3) ─────────────────────────────────────────────
  const weekMap: Record<string, number> = {};
  for (const s of sessions) {
    const key = getMondayKey(s.startedAt);
    weekMap[key] = (weekMap[key] ?? 0) + 1;
  }
  // Last 10 weeks (including current)
  const now = new Date();
  const weeklyData: { label: string; sessions: number }[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const key = getMondayKey(d);
    weeklyData.push({ label: formatWeekLabel(key), sessions: weekMap[key] ?? 0 });
  }

  // ── Score trend (LP5.4) ───────────────────────────────────────────────────────
  const scoreTrend = scoredSessions.map((s, i) => ({
    index: i + 1,
    date: new Date(s.startedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    score: s.overallScore!,
  }));

  // ── Emotion distribution (LP5.5) ─────────────────────────────────────────────
  const emotionDistribution = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([emotion, count]) => ({
      emotion,
      label: expressionLabels[emotion] ?? emotion,
      count,
      color: isExpressionColor(emotion) ? expressionColors[emotion] : "#879aa1",
    }));

  // ── Skills radar (LP5.6) ──────────────────────────────────────────────────────
  const typeScores: Record<string, { total: number; count: number }> = {
    behavioral: { total: 0, count: 0 },
    technical: { total: 0, count: 0 },
    situational: { total: 0, count: 0 },
    general: { total: 0, count: 0 },
  };
  for (const s of scoredSessions) {
    const cat = s.sessionType in typeScores ? s.sessionType : "general";
    typeScores[cat].total += s.overallScore!;
    typeScores[cat].count += 1;
  }
  const skillsData = Object.entries(typeScores).map(([category, { total, count }]) => ({
    category,
    score: count > 0 ? Math.round(total / count) : 0,
    fullMark: 100,
  }));

  // ── Stat card data ─────────────────────────────────────────────────────────
  const statCards = [
    {
      title: "Total Sessions",
      value: totalSessions.toString(),
      description: `${completedSessions.length} completed`,
      icon: Mic2,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Average Score",
      value: avgScore !== null ? `${avgScore}%` : "—",
      description: avgScore !== null ? `across ${scoredSessions.length} scored` : "No scored sessions yet",
      icon: Award,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Most Practiced",
      value: mostPracticedType ? (SESSION_TYPE_LABELS[mostPracticedType] ?? mostPracticedType) : "—",
      description: mostPracticedType ? `${typeCounts[mostPracticedType]} sessions` : "Start an interview",
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Dominant Emotion",
      value: dominantEmotion ? (expressionLabels[dominantEmotion] ?? dominantEmotion) : "—",
      description: dominantEmotion ? `${emotionCounts[dominantEmotion]} snapshots` : "No emotion data yet",
      icon: Brain,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Track your interview performance, skills development, and emotional growth.
          </p>
        </div>

        {/* Empty state */}
        {totalSessions === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <BarChart3 className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">No data yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete your first interview session to start tracking your progress.
                </p>
              </div>
              <Link
                href="/dashboard/interviews"
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start an Interview
              </Link>
            </CardContent>
          </Card>
        )}

        {totalSessions > 0 && (
          <>
            {/* Summary stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map(({ title, value, description, icon: Icon, color, bg }) => (
                <Card key={title}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className={`size-5 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{title}</p>
                      <p className="mt-0.5 text-xl font-bold leading-none tracking-tight">
                        {value}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts row 1 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Sessions Over Time</CardTitle>
                  <CardDescription>Weekly interview activity (last 10 weeks)</CardDescription>
                </CardHeader>
                <CardContent>
                  <SessionsChart data={weeklyData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Score Progression</CardTitle>
                  <CardDescription>Overall score per completed session</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScoreTrendChart data={scoreTrend} />
                </CardContent>
              </Card>
            </div>

            {/* Charts row 2 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Emotion Distribution</CardTitle>
                  <CardDescription>Top 6 dominant emotions across all sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmotionPieChart data={emotionDistribution} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Skills by Category</CardTitle>
                  <CardDescription>Average score across interview types</CardDescription>
                </CardHeader>
                <CardContent>
                  <SkillsRadar data={skillsData} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
