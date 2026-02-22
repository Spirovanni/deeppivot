"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ProgramCard } from "./ProgramCard";
import { FundingCard } from "./FundingCard";
import { Search, GraduationCap, Landmark } from "lucide-react";
import { cn } from "@/utils";

interface Program {
  id: number;
  name: string;
  provider: string;
  programType: string;
  duration: string;
  cost: number;
  roiScore: number | null;
  tags: string[];
  url: string;
  description: string;
}

interface FundingOpportunity {
  id: number;
  name: string;
  fundingType: string;
  amount: number | null;
  eligibilityText: string;
  applicationUrl: string;
  deadline: Date | null;
}

interface EducationExplorerProps {
  programs: Program[];
  funding: FundingOpportunity[];
}

type Tab = "all" | "bootcamp" | "certification" | "degree" | "workshop" | "funding";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All Programs" },
  { id: "bootcamp", label: "Bootcamps" },
  { id: "certification", label: "Certifications" },
  { id: "degree", label: "Degrees" },
  { id: "workshop", label: "Workshops" },
  { id: "funding", label: "Funding" },
];

export function EducationExplorer({ programs, funding }: EducationExplorerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [costFilter, setCostFilter] = useState<"all" | "free" | "paid">("all");

  const filteredPrograms = useMemo(() => {
    const q = search.toLowerCase().trim();
    return programs.filter((p) => {
      if (activeTab !== "all" && p.programType !== activeTab) return false;
      if (costFilter === "free" && p.cost > 0) return false;
      if (costFilter === "paid" && p.cost === 0) return false;
      if (q) {
        const hay =
          `${p.name} ${p.provider} ${p.programType} ${p.tags.join(" ")} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [programs, activeTab, search, costFilter]);

  const filteredFunding = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return funding;
    return funding.filter((f) => {
      const hay = `${f.name} ${f.fundingType} ${f.eligibilityText}`.toLowerCase();
      return hay.includes(q);
    });
  }, [funding, search]);

  const showFunding = activeTab === "funding";

  const selectCls =
    "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6">
      {/* Search + cost filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, or provider…"
            className="pl-9"
          />
        </div>
        {!showFunding && (
          <select
            value={costFilter}
            onChange={(e) => setCostFilter(e.target.value as "all" | "free" | "paid")}
            className={selectCls}
          >
            <option value="all">All Costs</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {tab.id === "funding" && <Landmark className="size-3.5" />}
            {tab.label}
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs tabular-nums">
              {tab.id === "funding"
                ? funding.length
                : tab.id === "all"
                ? programs.length
                : programs.filter((p) => p.programType === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {showFunding ? (
        <>
          <div className="flex items-center gap-2">
            <Landmark className="size-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filteredFunding.length} funding opportunit
              {filteredFunding.length !== 1 ? "ies" : "y"} available
            </p>
          </div>
          {filteredFunding.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredFunding.map((f) => (
                <FundingCard key={f.id} funding={f} />
              ))}
            </div>
          ) : (
            <EmptyState label="No funding matches your search." />
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filteredPrograms.length} programme
            {filteredPrograms.length !== 1 ? "s" : ""}
            {search || costFilter !== "all" ? " matching filters" : " available"}
          </p>
          {filteredPrograms.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPrograms.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))}
            </div>
          ) : (
            <EmptyState label="No programmes match your filters." />
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <GraduationCap className="size-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}
