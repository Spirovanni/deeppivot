"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  ArchetypeBreakdown,
  SessionTrend,
  MilestoneStatusBreakdown,
  WdbCohortStats,
} from "@/src/lib/actions/wdb-analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  archetypes: ArchetypeBreakdown[];
  sessionTrend: SessionTrend[];
  milestones: MilestoneStatusBreakdown[];
  stats: WdbCohortStats | null;
}

// ─── Color palette ────────────────────────────────────────────────────────────

const ARCHETYPE_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-lime-500",
];

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  completed:   "bg-emerald-500",
  "in-progress": "bg-blue-500",
  planned:     "bg-slate-400",
  blocked:     "bg-red-500",
  deferred:    "bg-amber-400",
};

// ─── Bar chart (custom SVG-free implementation using CSS) ─────────────────────

function BarChart({
  data,
  valueKey,
  labelKey,
  colors,
  maxValue,
}: {
  data: { [key: string]: string | number }[];
  valueKey: string;
  labelKey: string;
  colors: string[];
  maxValue: number;
}) {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Bar chart">
      {data.map((item, i) => {
        const value = Number(item[valueKey]);
        const label = String(item[labelKey]);
        const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const color = colors[i % colors.length];

        return (
          <div key={label} className="space-y-0.5" role="listitem">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate max-w-[60%]">{label}</span>
              <span className="font-medium tabular-nums">{value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${width}%` }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={maxValue}
                aria-label={`${label}: ${value}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Spark line (session trend) ───────────────────────────────────────────────

function SparkLine({ data }: { data: SessionTrend[] }) {
  if (data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
        No sessions in the last 30 days
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.sessions), 1);
  const width = 400;
  const height = 80;
  const padding = 4;
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
    const y = padding + (1 - d.sessions / max) * (height - padding * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const area = [
    `${padding},${height - padding}`,
    ...points,
    `${width - padding},${height - padding}`,
  ].join(" ");

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-20"
        aria-hidden="true"
        role="img"
        aria-label="Session trend sparkline"
      >
        {/* Area fill */}
        <polygon
          points={area}
          fill="currentColor"
          className="text-violet-500/15"
        />
        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-violet-500"
        />
        {/* Data points */}
        {points.map((pt, i) => {
          const [x, y] = pt.split(",").map(Number);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="currentColor"
              className="text-violet-500"
            />
          );
        })}
      </svg>

      {/* X-axis labels: first, middle, last dates */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Donut chart (milestone status) ──────────────────────────────────────────

function DonutChart({ data }: { data: MilestoneStatusBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
        No milestone data
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const radius = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((d, i) => {
    const fraction = d.count / total;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const segment = {
      ...d,
      dash,
      gap,
      offset,
      color: MILESTONE_STATUS_COLORS[d.status] ?? "bg-slate-400",
      strokeColor: (MILESTONE_STATUS_COLORS[d.status] ?? "bg-slate-400")
        .replace("bg-", "")
        .replace("-500", "")
        .replace("-400", ""),
    };
    offset += dash;
    return segment;
  });

  const colorMap: Record<string, string> = {
    "emerald": "#10b981",
    "blue": "#3b82f6",
    "slate": "#94a3b8",
    "red": "#ef4444",
    "amber": "#f59e0b",
  };

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="size-20 shrink-0" aria-hidden="true">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={colorMap[seg.strokeColor] ?? "#94a3b8"}
            strokeWidth="14"
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        ))}
        {/* Total in center */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          className="text-sm font-bold fill-foreground"
          fontSize="14"
        >
          {total}
        </text>
      </svg>

      <div className="flex flex-col gap-1 min-w-0">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-block size-2 rounded-full shrink-0 ${seg.color}`}
              aria-hidden="true"
            />
            <span className="text-muted-foreground capitalize truncate">{seg.status}</span>
            <span className="font-medium ml-auto tabular-nums">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function WdbChartsClient({ archetypes, sessionTrend, milestones }: Props) {
  const maxArchetypeCount = Math.max(...archetypes.map((a) => a.count), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Archetype breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Career Archetype Distribution</CardTitle>
            <Badge variant="outline" className="text-xs">{archetypes.length} types</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <BarChart
            data={archetypes as unknown as { [key: string]: string | number }[]}
            valueKey="count"
            labelKey="archetypeName"
            colors={ARCHETYPE_COLORS}
            maxValue={maxArchetypeCount}
          />
          {archetypes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No archetype assessments completed yet in this cohort.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Milestone status donut */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Milestone Status</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutChart data={milestones} />
        </CardContent>
      </Card>

      {/* Session trend sparkline */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Sessions — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <SparkLine data={sessionTrend} />
          {sessionTrend.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Total: <span className="font-medium text-foreground">
                {sessionTrend.reduce((s, d) => s + d.sessions, 0)}
              </span> sessions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
