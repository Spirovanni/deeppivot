"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { MentorCard } from "./MentorCard";
import { Search, Users } from "lucide-react";

interface Mentor {
  id: number;
  name: string;
  title: string;
  industry: string;
  expertise: string[];
  bio: string;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  contactUrl: string | null;
}

interface Connection {
  mentorId: number;
  status: string;
}

interface MentorGridProps {
  mentors: Mentor[];
  connections: Connection[];
}

export function MentorGrid({ mentors, connections }: MentorGridProps) {
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [expertiseFilter, setExpertiseFilter] = useState("all");

  // Derive unique industries + expertise areas
  const industries = useMemo(() => {
    const set = new Set(mentors.map((m) => m.industry));
    return Array.from(set).sort();
  }, [mentors]);

  const expertiseAreas = useMemo(() => {
    const set = new Set(mentors.flatMap((m) => m.expertise));
    return Array.from(set).sort();
  }, [mentors]);

  const connectionMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of connections) map.set(c.mentorId, c.status);
    return map;
  }, [connections]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mentors.filter((m) => {
      if (industryFilter !== "all" && m.industry !== industryFilter) return false;
      if (expertiseFilter !== "all" && !m.expertise.includes(expertiseFilter)) return false;
      if (q) {
        const hay = `${m.name} ${m.title} ${m.industry} ${m.expertise.join(" ")} ${m.bio}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [mentors, search, industryFilter, expertiseFilter]);

  const selectCls =
    "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6">
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mentors by name, skill, or industry…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">All Industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <select
            value={expertiseFilter}
            onChange={(e) => setExpertiseFilter(e.target.value)}
            className={selectCls}
          >
            <option value="all">All Expertise</option>
            {expertiseAreas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} mentor{filtered.length !== 1 ? "s" : ""}
        {search || industryFilter !== "all" || expertiseFilter !== "all"
          ? " matching your filters"
          : " available"}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              connectionStatus={
                (connectionMap.get(mentor.id) as "pending" | "accepted" | "declined") ?? "none"
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            No mentors match your filters — try broadening your search.
          </p>
        </div>
      )}
    </div>
  );
}
