"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RadarPoint {
  category: string;
  score: number;
  fullMark: number;
}

interface SkillsRadarProps {
  data: RadarPoint[];
}

const CATEGORY_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  general: "General",
};

export function SkillsRadar({ data }: SkillsRadarProps) {
  const hasAnyScore = data.some((d) => d.score > 0);

  if (!hasAnyScore) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Complete scored sessions across different types to see your skills map.
      </div>
    );
  }

  const labelledData = data.map((d) => ({
    ...d,
    category: CATEGORY_LABELS[d.category] ?? d.category,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={labelledData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 12, fill: "currentColor", opacity: 0.6 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
          tickCount={4}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value) => [`${value ?? 0}%`, "Avg Score"]}
        />
        <Radar
          name="Performance"
          dataKey="score"
          stroke="#a855f7"
          fill="#a855f7"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
