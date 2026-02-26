"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, DollarSign, Clock, ChevronDown, ChevronUp } from "lucide-react";
import {
  matchFundingEligibility,
  type FundingEligibilityInput,
  type FundingMatch,
} from "@/src/lib/alt-ed-roi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FundingOpportunity {
  id: number;
  name: string;
  fundingType: string;
  amount: number | null;
  eligibilityText: string;
  applicationUrl: string;
  deadline: Date | null;
}

interface FundingPanelProps {
  opportunities: FundingOpportunity[];
  programType: string;
  programTags: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FUNDING_TYPE_COLORS: Record<string, string> = {
  grant:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  scholarship: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  isa:         "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  loan:        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function formatAmount(amount: number | null): string {
  if (amount === null) return "Varies";
  if (amount === 0) return "Free";
  const dollars = amount / 100;
  if (dollars >= 1000) return `Up to $${(dollars / 1000).toFixed(0)}k`;
  return `$${dollars.toLocaleString()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FundingPanel({ opportunities, programType, programTags }: FundingPanelProps) {
  const [profile, setProfile] = useState<FundingEligibilityInput>({
    annualIncomeUsd: 45_000,
    state: null,
    usCitizen: true,
    isVeteran: false,
    isDislocatedWorker: false,
    isFirstGenStudent: false,
    programType,
    programTags,
  });

  const [showForm, setShowForm] = useState(false);
  const [matched, setMatched] = useState<FundingMatch[] | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const updateProfile = (patch: Partial<FundingEligibilityInput>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  const runCheck = () => {
    const results = matchFundingEligibility(opportunities, {
      ...profile,
      programType,
      programTags,
    });
    setMatched(results);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Funding & Grants</h3>
          <p className="text-xs text-muted-foreground">
            {opportunities.length} funding source{opportunities.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
          className="gap-1.5"
          aria-expanded={showForm}
        >
          Check eligibility
        </Button>
      </div>

      {/* Profile form */}
      {showForm && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
          <p className="text-xs font-medium text-muted-foreground">
            Answer a few questions to see which funding sources you may qualify for.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="income">Annual Income (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="income"
                  type="number"
                  min={0}
                  step={5000}
                  value={profile.annualIncomeUsd}
                  onChange={(e) => updateProfile({ annualIncomeUsd: parseInt(e.target.value) || 0 })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">State (optional)</Label>
              <Input
                id="state"
                placeholder="e.g. NY"
                maxLength={2}
                value={profile.state ?? ""}
                onChange={(e) => updateProfile({ state: e.target.value.toUpperCase() || null })}
              />
            </div>
          </div>

          <div className="space-y-2">
            {[
              { key: "usCitizen", label: "I am a U.S. citizen or eligible non-citizen" },
              { key: "isVeteran", label: "I am a U.S. military veteran" },
              { key: "isDislocatedWorker", label: "I was recently laid off or am a dislocated worker" },
              { key: "isFirstGenStudent", label: "I am a first-generation college student" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile[key as keyof FundingEligibilityInput] as boolean}
                  onChange={(e) => updateProfile({ [key]: e.target.checked })}
                  className="rounded accent-primary"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={runCheck}>Check eligibility</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Results */}
      {matched !== null && (
        <div className="space-y-2">
          {matched.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No exact matches found based on your profile.
              <br />
              <span className="text-xs">All funding sources are listed below — check directly for latest eligibility requirements.</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {matched.length} potential match{matched.length !== 1 ? "es" : ""} found
              </p>
              {matched.map((m) => (
                <FundingCard
                  key={m.fundingId}
                  match={m}
                  highlighted
                  expanded={expandedId === m.fundingId}
                  onToggle={() => setExpandedId((v) => v === m.fundingId ? null : m.fundingId)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* All opportunities (shown when no check run, or as full list) */}
      {matched === null && (
        <div className="space-y-2">
          {opportunities.map((opp) => (
            <FundingCard
              key={opp.id}
              match={{
                fundingId: opp.id,
                name: opp.name,
                fundingType: opp.fundingType,
                amount: opp.amount,
                eligibilityText: opp.eligibilityText,
                applicationUrl: opp.applicationUrl,
                deadline: opp.deadline,
                matchReason: "",
              }}
              highlighted={false}
              expanded={expandedId === opp.id}
              onToggle={() => setExpandedId((v) => v === opp.id ? null : opp.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FundingCard({
  match,
  highlighted,
  expanded,
  onToggle,
}: {
  match: FundingMatch;
  highlighted: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color = FUNDING_TYPE_COLORS[match.fundingType] ?? "bg-slate-100 text-slate-600";

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${highlighted ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{match.name}</p>
          {match.matchReason && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{match.matchReason}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${color}`}>
            {match.fundingType}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {formatAmount(match.amount)}
          </span>
        </div>
      </div>

      {match.deadline && (
        <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <Clock className="size-3" aria-hidden="true" />
          Deadline: {new Date(match.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}

      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
        aria-expanded={expanded}
      >
        {expanded ? <><ChevronUp className="size-3" aria-hidden="true" />Hide details</> : <><ChevronDown className="size-3" aria-hidden="true" />Show eligibility</>}
      </button>

      {expanded && (
        <div className="pt-1 space-y-2 border-t">
          <p className="text-xs text-muted-foreground">{match.eligibilityText}</p>
          <a
            href={match.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Apply / Learn more
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}
