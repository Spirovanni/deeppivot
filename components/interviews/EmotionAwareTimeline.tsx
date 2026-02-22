"use client";

import { motion } from "framer-motion";
import { expressionColors, isExpressionColor } from "@/utils/expressionColors";
import { expressionLabels } from "@/utils/expressionLabels";
import { useState } from "react";

interface EmotionSnapshot {
  startTime: number;
  endTime: number;
  dominantEmotion: string;
  dominantScore: number;
}

interface AggregateEmotion {
  name: string;
  score: number;
}

interface EmotionAwareTimelineProps {
  snapshots: EmotionSnapshot[];
  aggregateEmotions: AggregateEmotion[];
  overallDominantEmotion: string;
  /** Total duration in seconds (from transcript or session) */
  durationSeconds?: number;
}

function normalizeEmotionKey(emotion: string): string {
  return emotion.charAt(0).toLowerCase() + emotion.slice(1);
}

function getBarColor(emotion: string): string {
  const key = normalizeEmotionKey(emotion);
  return isExpressionColor(key) ? expressionColors[key as keyof typeof expressionColors] : "#879aa1";
}

function getLabel(emotion: string): string {
  const key = normalizeEmotionKey(emotion);
  return expressionLabels[key] ?? expressionLabels[emotion] ?? emotion;
}

export function EmotionAwareTimeline({
  snapshots,
  aggregateEmotions,
  overallDominantEmotion,
  durationSeconds,
}: EmotionAwareTimelineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No emotion timeline data for this session.
        </p>
      </div>
    );
  }

  const totalMs = durationSeconds
    ? durationSeconds * 1000
    : Math.max(...snapshots.map((s) => s.endTime)) - Math.min(...snapshots.map((s) => s.startTime));
  const minStart = Math.min(...snapshots.map((s) => s.startTime));

  const getLeftPercent = (startTime: number) => {
    if (totalMs <= 0) return 0;
    const elapsed = startTime - minStart;
    return Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
  };

  const getWidthPercent = (startTime: number, endTime: number) => {
    if (totalMs <= 0) return 5;
    const span = endTime - startTime;
    return Math.max(2, (span / totalMs) * 100);
  };

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    return mins > 0 ? `${mins}:${String(secs % 60).padStart(2, "0")}` : `0:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Dominant emotion badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-3 rounded-full"
          style={{ backgroundColor: getBarColor(overallDominantEmotion) }}
        />
        <span className="text-sm font-medium">
          Overall tone: {getLabel(overallDominantEmotion)}
        </span>
      </div>

      {/* Timeline bars */}
      <div className="relative h-16 w-full overflow-hidden rounded-lg bg-muted/50">
        {snapshots.map((snap, i) => {
          const color = getBarColor(snap.dominantEmotion);
          const leftPct = getLeftPercent(snap.startTime);
          const widthPct = getWidthPercent(snap.startTime, snap.endTime);
          const isHovered = hoveredIdx === i;

          return (
            <motion.div
              key={`${snap.startTime}-${i}`}
              className="absolute bottom-0 cursor-pointer rounded-t-sm"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                minWidth: 6,
                backgroundColor: color,
                opacity: hoveredIdx === null || isHovered ? 1 : 0.5,
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `${Math.max(20, snap.dominantScore * 100)}%`,
                opacity: 1,
              }}
              transition={{ duration: 0.4, delay: i * 0.02, ease: "easeOut" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {hoveredIdx !== null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${getLeftPercent(snapshots[hoveredIdx].startTime) + getWidthPercent(snapshots[hoveredIdx].startTime, snapshots[hoveredIdx].endTime) / 2}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-medium">
              {getLabel(snapshots[hoveredIdx].dominantEmotion)}
            </p>
            <p className="text-muted-foreground">
              {(snapshots[hoveredIdx].dominantScore * 100).toFixed(0)}% ·{" "}
              {formatTime(snapshots[hoveredIdx].startTime)}–{formatTime(snapshots[hoveredIdx].endTime)}
            </p>
          </div>
        )}
      </div>

      {/* Top emotions legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {aggregateEmotions.slice(0, 5).map((e) => (
          <div key={e.name} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: getBarColor(e.name) }}
            />
            <span className="text-xs text-muted-foreground">
              {getLabel(e.name)} ({(e.score * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
