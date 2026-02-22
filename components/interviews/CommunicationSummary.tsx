import { expressionLabels } from "@/utils/expressionLabels";
import { expressionColors, isExpressionColor } from "@/utils/expressionColors";

interface Snapshot {
  dominantEmotion: string;
  confidence: number;
  emotions: unknown;
}

interface CommunicationSummaryProps {
  snapshots: Snapshot[];
  sessionType: string;
}

// Emotion → category mapping for insight generation
const EMOTION_CATEGORIES: Record<string, string[]> = {
  confident: [
    "determination", "pride", "triumph", "confidence", "admiration",
    "satisfaction", "enthusiasm", "joy", "excitement", "contentment",
  ],
  anxious: [
    "anxiety", "fear", "distress", "awkwardness", "embarrassment", "shame",
    "nervousness", "horror",
  ],
  engaged: [
    "interest", "concentration", "contemplation", "awe", "aestheticAppreciation",
    "realization", "surprise", "surprisePositive",
  ],
  calm: [
    "calmness", "neutral", "contentment", "relief", "satisfaction",
  ],
  negative: [
    "anger", "disgust", "contempt", "disappointment", "sadness", "annoyance",
    "boredom", "tiredness",
  ],
};

function categoriseEmotions(snapshots: Snapshot[]): Record<string, number> {
  const counts: Record<string, number> = {
    confident: 0,
    anxious: 0,
    engaged: 0,
    calm: 0,
    negative: 0,
  };

  for (const snap of snapshots) {
    for (const [cat, emotions] of Object.entries(EMOTION_CATEGORIES)) {
      if (emotions.includes(snap.dominantEmotion)) {
        counts[cat] += snap.confidence;
      }
    }
  }

  return counts;
}

function buildInsights(
  counts: Record<string, number>,
  topEmotions: [string, number][],
  sessionType: string
): string[] {
  const insights: string[] = [];
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const pct = (cat: string) => counts[cat] / total;

  const top = topEmotions[0]?.[0];
  const topLabel = top ? (expressionLabels[top] ?? top) : "neutral";

  if (pct("confident") > 0.35) {
    insights.push(
      `Strong confidence detected throughout — ${topLabel} was your most prominent signal. This projects well in ${sessionType} interviews.`
    );
  } else if (pct("anxious") > 0.35) {
    insights.push(
      `Some nervousness was present (${topLabel} was dominant). This is normal — focused breathing before answering can help stabilise your emotional tone.`
    );
  } else if (pct("engaged") > 0.35) {
    insights.push(
      `High engagement registered — your ${topLabel} response indicates you were thoughtful and attentive throughout the interview.`
    );
  } else if (pct("calm") > 0.35) {
    insights.push(
      `You maintained a calm, steady presence. Consider projecting slightly more enthusiasm to signal genuine interest in ${sessionType} contexts.`
    );
  } else {
    insights.push(
      `Your emotional range was varied. ${topLabel} was the strongest signal detected across the session.`
    );
  }

  if (pct("anxious") > 0.2 && pct("confident") > 0.2) {
    insights.push(
      "Confidence and anxiety alternated during the session — this often reflects genuine effort. Consistency comes with repeated practice."
    );
  }

  if (pct("engaged") > 0.25) {
    insights.push(
      "Sustained engagement signals indicate you were actively processing questions rather than reciting rehearsed answers — a strong positive marker."
    );
  }

  if (pct("negative") > 0.25) {
    insights.push(
      "Some frustration or negative affect was detected. Identifying which question topics triggered this can help you prepare targeted responses."
    );
  }

  return insights;
}

export function CommunicationSummary({
  snapshots,
  sessionType,
}: CommunicationSummaryProps) {
  if (snapshots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No emotion data available for this session.
      </p>
    );
  }

  // Aggregate emotion scores across all snapshots
  const totals: Record<string, number> = {};
  for (const snap of snapshots) {
    const emotions = snap.emotions as Record<string, number> | null;
    if (!emotions) continue;
    for (const [emotion, score] of Object.entries(emotions)) {
      totals[emotion] = (totals[emotion] ?? 0) + score;
    }
  }

  const topEmotions = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const counts = categoriseEmotions(snapshots);
  const insights = buildInsights(counts, topEmotions, sessionType);

  const getColor = (emotion: string) =>
    isExpressionColor(emotion) ? expressionColors[emotion] : "#879aa1";

  return (
    <div className="space-y-5">
      {/* Top emotions bar chart */}
      <div className="space-y-2">
        {topEmotions.map(([emotion, score]) => {
          const maxScore = topEmotions[0][1];
          const widthPct = maxScore > 0 ? (score / maxScore) * 100 : 0;
          const color = getColor(emotion);
          const label = expressionLabels[emotion] ?? emotion;

          return (
            <div key={emotion} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
                {label}
              </span>
              <div className="relative h-2.5 flex-1 rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${widthPct}%`, backgroundColor: color }}
                />
              </div>
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                {(score / snapshots.length).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="mt-0.5 shrink-0 text-primary">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
