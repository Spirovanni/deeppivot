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
import type { TraitScore } from "@/src/lib/archetypes";

interface TraitRadarProps {
  traits: TraitScore[];
}

export function TraitRadar({ traits }: TraitRadarProps) {
  const data = traits.map((t) => ({
    dimension: t.label,
    score: parseFloat(t.normalized.toFixed(1)),
    fullMark: 5,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 12, fill: "currentColor", opacity: 0.65 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }}
          tickCount={4}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value) => [`${value} / 5`, "Score"]}
        />
        <Radar
          name="Your Profile"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
