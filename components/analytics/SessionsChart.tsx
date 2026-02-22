"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WeeklyPoint {
  label: string;
  sessions: number;
}

interface SessionsChartProps {
  data: WeeklyPoint[];
}

export function SessionsChart({ data }: SessionsChartProps) {
  if (data.every((d) => d.sessions === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No session data yet — complete your first interview to see trends.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(value) => [value ?? 0, "Sessions"]}
        />
        <Area
          type="monotone"
          dataKey="sessions"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#sessionsGrad)"
          dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
