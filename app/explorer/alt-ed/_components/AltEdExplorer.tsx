"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RoiCalculator } from "./RoiCalculator";
import { FundingPanel } from "./FundingPanel";
import {
  Search,
  X,
  ExternalLink,
  SlidersHorizontal,
  Star,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Calculator,
  HandCoins,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface AltEdExplorerProps {
  initialPrograms: Program[];
  fundingOpportunities: FundingOpportunity[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRAM_TYPES = [
  { value: "bootcamp", label: "Bootcamp" },
  { value: "certification", label: "Certification" },
  { value: "online-course", label: "Online Course" },
  { value: "degree", label: "Degree" },
  { value: "trade", label: "Trade / Apprenticeship" },
  { value: "workshop", label: "Workshop" },
];

const COST_RANGES = [
  { label: "Free", max: 0 },
  { label: "Under $500", max: 50000 },
  { label: "Under $2,000", max: 200000 },
  { label: "Under $5,000", max: 500000 },
  { label: "Under $10,000", max: 1000000 },
  { label: "Under $20,000", max: 2000000 },
  { label: "Any price", max: Infinity },
];

const ROI_THRESHOLDS = [
  { label: "Any", min: 0 },
  { label: "60+", min: 60 },
  { label: "70+", min: 70 },
  { label: "80+", min: 80 },
  { label: "85+", min: 85 },
];

const POPULAR_TAGS = [
  "javascript", "python", "react", "machine-learning", "cybersecurity",
  "aws", "data-science", "free", "apprenticeship", "full-stack",
  "kubernetes", "sql", "design", "project-management", "healthcare",
];

const SORT_OPTIONS = [
  { value: "roi-desc", label: "Highest ROI" },
  { value: "cost-asc", label: "Lowest cost" },
  { value: "cost-desc", label: "Highest cost" },
  { value: "name-asc", label: "A → Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCost(cents: number): string {
  if (cents === 0) return "Free";
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(0)}k`;
  return `$${dollars.toLocaleString()}`;
}

function programTypeColor(type: string): string {
  switch (type) {
    case "bootcamp": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
    case "certification": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "online-course": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "degree": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "trade": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "workshop": return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
    default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

function roiColor(score: number | null): string {
  if (!score) return "text-muted-foreground";
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-blue-600 dark:text-blue-400";
  if (score >= 65) return "text-amber-600 dark:text-amber-400";
  return "text-slate-500";
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({
  program,
  fundingOpportunities,
}: {
  program: Program;
  fundingOpportunities: FundingOpportunity[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRoi, setShowRoi] = useState(false);
  const [showFunding, setShowFunding] = useState(false);

  return (
    <>
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{program.provider}</p>
            <CardTitle className="text-sm font-semibold leading-tight mt-0.5 line-clamp-2">
              {program.name}
            </CardTitle>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${programTypeColor(program.programType)}`}>
            {PROGRAM_TYPES.find((t) => t.value === program.programType)?.label ?? program.programType}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-3 pt-0">
        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="size-3" aria-hidden="true" />
            <span className="font-medium text-foreground">{formatCost(program.cost)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {program.duration}
          </span>
          {program.roiScore !== null && (
            <span className={`flex items-center gap-1 ml-auto font-semibold ${roiColor(program.roiScore)}`}>
              <Star className="size-3" aria-hidden="true" />
              {program.roiScore} ROI
            </span>
          )}
        </div>

        {/* Description */}
        <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
          {program.description}
        </p>
        {program.description.length > 120 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
            aria-expanded={expanded}
          >
            {expanded ? (
              <><ChevronUp className="size-3" aria-hidden="true" /> Less</>
            ) : (
              <><ChevronDown className="size-3" aria-hidden="true" /> More</>
            )}
          </button>
        )}

        {/* Tags */}
        {program.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {program.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {program.tags.length > 5 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
                +{program.tags.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="mt-auto pt-1 flex items-center gap-3 flex-wrap">
          <a
            href={program.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Visit program
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setShowRoi(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="Calculate ROI"
          >
            <Calculator className="size-3" aria-hidden="true" />
            ROI
          </button>
          <button
            type="button"
            onClick={() => setShowFunding((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="View funding options"
            aria-expanded={showFunding}
          >
            <HandCoins className="size-3" aria-hidden="true" />
            Funding
          </button>
        </div>

        {/* Funding panel (inline) */}
        {showFunding && (
          <div className="border-t pt-3">
            <FundingPanel
              opportunities={fundingOpportunities}
              programType={program.programType}
              programTags={program.tags}
            />
          </div>
        )}
      </CardContent>
    </Card>

    {/* ROI Calculator modal */}
    {showRoi && (
      <RoiCalculator
        program={program}
        onClose={() => setShowRoi(false)}
      />
    )}
    </>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

interface FilterState {
  search: string;
  programTypes: Set<string>;
  maxCostIndex: number;
  minRoiIndex: number;
  activeTags: Set<string>;
  sort: string;
}

function FilterPanel({
  filters,
  onChange,
  totalResults,
}: {
  filters: FilterState;
  onChange: (update: Partial<FilterState>) => void;
  totalResults: number;
}) {
  const toggleType = (type: string) => {
    const next = new Set(filters.programTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    onChange({ programTypes: next });
  };

  const toggleTag = (tag: string) => {
    const next = new Set(filters.activeTags);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    onChange({ activeTags: next });
  };

  return (
    <aside className="space-y-6" aria-label="Filter programs">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Program Type
        </p>
        <div className="space-y-2">
          {PROGRAM_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.programTypes.has(type.value)}
                onChange={() => toggleType(type.value)}
                className="rounded border-border accent-primary"
                aria-label={type.label}
              />
              <span className="text-sm">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Max Cost
        </p>
        <div className="space-y-1.5">
          {COST_RANGES.map((range, i) => (
            <label key={range.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cost-range"
                checked={filters.maxCostIndex === i}
                onChange={() => onChange({ maxCostIndex: i })}
                className="accent-primary"
              />
              <span className="text-sm">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Min ROI Score
        </p>
        <div className="space-y-1.5">
          {ROI_THRESHOLDS.map((threshold, i) => (
            <label key={threshold.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="roi-threshold"
                checked={filters.minRoiIndex === i}
                onChange={() => onChange({ minRoiIndex: i })}
                className="accent-primary"
              />
              <span className="text-sm">{threshold.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Popular Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                filters.activeTags.has(tag)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary hover:text-primary"
              }`}
              aria-pressed={filters.activeTags.has(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalResults}</span> programs found
        </p>
      </div>
    </aside>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AltEdExplorer({ initialPrograms, fundingOpportunities }: AltEdExplorerProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    programTypes: new Set(),
    maxCostIndex: COST_RANGES.length - 1, // "Any price"
    minRoiIndex: 0, // "Any"
    activeTags: new Set(),
    sort: "roi-desc",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateFilters = useCallback((update: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...update }));
  }, []);

  const filtered = useMemo(() => {
    let results = [...initialPrograms];

    // Text search
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.provider.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    // Program type
    if (filters.programTypes.size > 0) {
      results = results.filter((p) => filters.programTypes.has(p.programType));
    }

    // Max cost
    const maxCost = COST_RANGES[filters.maxCostIndex].max;
    if (maxCost !== Infinity) {
      results = results.filter((p) => p.cost <= maxCost);
    }

    // Min ROI
    const minRoi = ROI_THRESHOLDS[filters.minRoiIndex].min;
    if (minRoi > 0) {
      results = results.filter((p) => p.roiScore !== null && p.roiScore >= minRoi);
    }

    // Tags
    if (filters.activeTags.size > 0) {
      results = results.filter((p) =>
        [...filters.activeTags].every((tag) =>
          p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        )
      );
    }

    // Sort
    switch (filters.sort) {
      case "roi-desc":
        results.sort((a, b) => (b.roiScore ?? 0) - (a.roiScore ?? 0));
        break;
      case "cost-asc":
        results.sort((a, b) => a.cost - b.cost);
        break;
      case "cost-desc":
        results.sort((a, b) => b.cost - a.cost);
        break;
      case "name-asc":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return results;
  }, [initialPrograms, filters]);

  const hasActiveFilters =
    filters.search.trim() ||
    filters.programTypes.size > 0 ||
    filters.maxCostIndex !== COST_RANGES.length - 1 ||
    filters.minRoiIndex !== 0 ||
    filters.activeTags.size > 0;

  const clearFilters = () => {
    setFilters({
      search: "",
      programTypes: new Set(),
      maxCostIndex: COST_RANGES.length - 1,
      minRoiIndex: 0,
      activeTags: new Set(),
      sort: "roi-desc",
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Alt-Ed Explorer</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Discover {initialPrograms.length.toLocaleString()}+ alternative education programs — bootcamps,
          certifications, trade apprenticeships, and more. Filter by cost, ROI, and category to find your path.
        </p>
      </div>

      {/* Search + controls bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search programs, providers, tags…"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-9 pr-4"
            aria-label="Search programs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="sort-select" className="sr-only">Sort by</Label>
          <select
            id="sort-select"
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Sort programs"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Mobile filter toggle */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden gap-2"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            aria-expanded={mobileFiltersOpen}
            aria-controls="filter-panel"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 size-2 rounded-full bg-primary" aria-label="Active filters" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear all filters"
            >
              <X className="size-4" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 shrink-0">
          <FilterPanel
            filters={filters}
            onChange={updateFilters}
            totalResults={filtered.length}
          />
        </div>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div
            id="filter-panel"
            className="lg:hidden fixed inset-0 z-40 flex"
            role="dialog"
            aria-modal="true"
            aria-label="Filter programs"
          >
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileFiltersOpen(false)}
              aria-hidden="true"
            />
            <div className="relative ml-auto h-full w-80 max-w-full bg-background shadow-xl overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              </div>
              <FilterPanel
                filters={filters}
                onChange={updateFilters}
                totalResults={filtered.length}
              />
            </div>
          </div>
        )}

        {/* Results grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium">No programs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or search term.
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
                {initialPrograms.length.toLocaleString()} programs
              </p>
              <div
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                aria-label="Program results"
                aria-live="polite"
                aria-atomic="false"
              >
              {filtered.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  fundingOpportunities={fundingOpportunities}
                />
              ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
