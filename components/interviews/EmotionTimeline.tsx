"use client";

import { motion } from "framer-motion";
import { expressionColors, isExpressionColor } from "@/utils/expressionColors";
import { expressionLabels } from "@/utils/expressionLabels";
import { useState } from "react";

interface Snapshot {
  id: number;
  capturedAt: Date;
  dominantEmotion: string;
  confidence: number;
}

interface EmotionTimelineProps {
  snapshots: Snapshot[];
  sessionStartedAt: Date;
}

export function EmotionTimeline({ snapshots, sessionStartedAt }: EmotionTimelineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (snapshots.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No emotion data captured for this session.
      </p>
    );
  }

  const sessionDurationMs =
    snapshots[snapshots.length - 1].capturedAt.getTime() -
    sessionStartedAt.getTime();

  const getBarColor = (emotion: string) =>
    isExpressionColor(emotion) ? expressionColors[emotion] : "#879aa1";

  const getOffsetPercent = (capturedAt: Date) => {
    if (sessionDurationMs <= 0) return 0;
    const elapsed = capturedAt.getTime() - sessionStartedAt.getTime();
    return Math.min(100, Math.max(0, (elapsed / sessionDurationMs) * 100));
  };

  const formatElapsed = (capturedAt: Date) => {
    const ms = capturedAt.getTime() - sessionStartedAt.getTime();
    const mins = Math.floor(ms / 60_000);
    const secs = Math.floor((ms % 60_000) / 1000);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-3">
      {/* Bars */}
      <div className="relative h-20 w-full rounded-lg bg-muted/50 overflow-hidden">
        {snapshots.map((snap, i) => {
          const color = getBarColor(snap.dominantEmotion);
          const heightPct = Math.max(8, snap.confidence * 100);
          const leftPct = getOffsetPercent(snap.capturedAt);
          const isHovered = hoveredIdx === i;

          return (
            <motion.div
              key={snap.id}
              className="absolute bottom-0 cursor-pointer rounded-t-sm"
              style={{
                left: `${leftPct}%`,
                width: "clamp(6px, 1.2%, 14px)",
                backgroundColor: color,
                opacity: hoveredIdx === null || isHovered ? 1 : 0.45,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${heightPct}%` }}
              transition={{ duration: 0.6, delay: i * 0.02, ease: "easeOut" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {/* Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="pointer-events-none absolute bottom-full mb-2 z-10 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${getOffsetPercent(snapshots[hoveredIdx].capturedAt)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-medium">
              {expressionLabels[snapshots[hoveredIdx].dominantEmotion] ??
                snapshots[hoveredIdx].dominantEmotion}
            </p>
            <p className="text-muted-foreground">
              {(snapshots[hoveredIdx].confidence * 100).toFixed(1)}% confidence ·{" "}
              {formatElapsed(snapshots[hoveredIdx].capturedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0:00</span>
        <span>{formatElapsed(snapshots[snapshots.length - 1].capturedAt)}</span>
      </div>

      {/* Legend — top 5 distinct emotions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Array.from(new Set(snapshots.map((s) => s.dominantEmotion)))
          .slice(0, 5)
          .map((emotion) => (
            <div key={emotion} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: getBarColor(emotion) }}
              />
              <span className="text-xs text-muted-foreground">
                {expressionLabels[emotion] ?? emotion}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
