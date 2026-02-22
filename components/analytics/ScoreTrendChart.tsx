"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface ScorePoint {
  index: number;
  date: string;
  score: number;
}

interface ScoreTrendChartProps {
  data: ScorePoint[];
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Complete a scored session to track your progress.
      </div>
    );
  }

  const avg = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine
          y={avg}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          strokeOpacity={0.6}
          label={{
            value: `avg ${avg}%`,
            position: "insideTopRight",
            fontSize: 10,
            fill: "#f59e0b",
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value) => [`${value ?? 0}%`, "Score"]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
