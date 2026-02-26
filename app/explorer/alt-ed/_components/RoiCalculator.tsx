"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  X,
} from "lucide-react";
import {
  calculateRoi,
  SALARY_BENCHMARKS,
  type RoiInputs,
  type RoiResult,
} from "@/src/lib/alt-ed-roi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Program {
  id: number;
  name: string;
  provider: string;
  programType: string;
  duration: string;
  cost: number; // cents
}

interface RoiCalculatorProps {
  program: Program;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIELD_OPTIONS = Object.keys(SALARY_BENCHMARKS).map((key) => ({
  value: key,
  label: key
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" "),
}));

function formatCurrency(dollars: number): string {
  if (Math.abs(dollars) >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(dollars) >= 1_000) {
    return `$${(dollars / 1_000).toFixed(0)}k`;
  }
  return `$${dollars.toLocaleString()}`;
}

function roiColor(pct: number): string {
  if (pct >= 200) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 50) return "text-blue-600 dark:text-blue-400";
  if (pct >= 0) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoiCalculator({ program, onClose }: RoiCalculatorProps) {
  const programCostUsd = program.cost / 100;

  const [inputs, setInputs] = useState<Omit<RoiInputs, "programCostUsd" | "programDuration" | "programType">>({
    currentSalary: 55_000,
    targetField: "software-engineering",
    targetLevel: "mid",
    projectionYears: 3,
    fullTimeStudy: false,
  });

  const result: RoiResult = calculateRoi({
    ...inputs,
    programCostUsd,
    programDuration: program.duration,
    programType: program.programType,
  });

  const update = (patch: Partial<typeof inputs>) =>
    setInputs((prev) => ({ ...prev, ...patch }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="ROI Calculator"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border bg-background shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background px-6 py-4">
          <div className="flex items-center gap-2">
            <Calculator className="size-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold">ROI Calculator</h2>
              <p className="text-xs text-muted-foreground">{program.name} · {program.provider}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close calculator"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Inputs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="current-salary">Current Annual Salary</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="current-salary"
                  type="number"
                  min={0}
                  step={1000}
                  value={inputs.currentSalary}
                  onChange={(e) => update({ currentSalary: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target-field">Target Career Field</Label>
              <select
                id="target-field"
                value={inputs.targetField}
                onChange={(e) => update({ targetField: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {FIELD_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="target-level">Target Experience Level</Label>
              <select
                id="target-level"
                value={inputs.targetLevel}
                onChange={(e) => update({ targetLevel: e.target.value as "entry" | "mid" | "senior" })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="entry">Entry level</option>
                <option value="mid">Mid level</option>
                <option value="senior">Senior level</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projection-years">Projection Horizon</Label>
              <select
                id="projection-years"
                value={inputs.projectionYears}
                onChange={(e) => update({ projectionYears: parseInt(e.target.value) })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={1}>1 year</option>
                <option value={2}>2 years</option>
                <option value={3}>3 years</option>
                <option value={5}>5 years</option>
                <option value={10}>10 years</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={inputs.fullTimeStudy}
              onChange={(e) => update({ fullTimeStudy: e.target.checked })}
              className="rounded accent-primary"
            />
            I'll study full-time (include forgone income as cost)
          </label>

          {/* Results */}
          <div className="rounded-lg border bg-muted/30 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-semibold">Estimated ROI</h3>
            </div>

            {/* Big ROI number */}
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${roiColor(result.roiPercent)}`}>
                {result.roiPercent === 999 ? "∞" : `${result.roiPercent > 0 ? "+" : ""}${result.roiPercent}%`}
              </span>
              <span className="text-sm text-muted-foreground">over {inputs.projectionYears} year{inputs.projectionYears !== 1 ? "s" : ""}</span>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Current salary", value: formatCurrency(result.currentSalary), neutral: true },
                { label: "Post-program salary", value: formatCurrency(result.postProgramSalary) },
                { label: "Annual gain", value: `+${formatCurrency(result.annualGain)}` },
                { label: "Program cost", value: formatCurrency(result.programCostUsd), negative: true },
                { label: "Opportunity cost", value: result.opportunityCostUsd > 0 ? `-${formatCurrency(result.opportunityCostUsd)}` : "None", negative: result.opportunityCostUsd > 0 },
                { label: "Total invested", value: formatCurrency(result.totalInvestedUsd), negative: true },
                { label: `Net gain (${inputs.projectionYears}yr)`, value: (result.netGainUsd >= 0 ? "+" : "") + formatCurrency(result.netGainUsd) },
                {
                  label: "Break-even",
                  value: result.paybackMonths < 0
                    ? "Never"
                    : result.paybackMonths < 12
                    ? `${result.paybackMonths}mo`
                    : `${result.breakEvenYear}yr`,
                },
              ].map(({ label, value, neutral, negative }) => (
                <div key={label} className="rounded bg-background p-2.5 space-y-0.5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-sm font-semibold ${neutral ? "" : negative ? "text-red-500 dark:text-red-400" : roiColor(result.roiPercent)}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Salary benchmarks */}
            <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
              <p className="font-medium text-foreground">Salary benchmarks used:</p>
              {(["entry", "mid", "senior"] as const).map((lvl) => {
                const bench = SALARY_BENCHMARKS[inputs.targetField];
                return bench ? (
                  <p key={lvl} className={lvl === inputs.targetLevel ? "font-medium text-foreground" : ""}>
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}: {formatCurrency(bench[lvl])}/yr
                    {lvl === inputs.targetLevel && (
                      <Badge variant="outline" className="ml-2 text-xs">selected</Badge>
                    )}
                  </p>
                ) : null;
              })}
            </div>

            {/* Summary sentence */}
            <p className="text-sm text-muted-foreground italic border-t pt-3">{result.summary}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            * Estimates use industry median salaries (BLS + LinkedIn Salary, 2025). Actual outcomes vary by location, employer, and individual performance. This is not financial advice.
          </p>

          <Button className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
