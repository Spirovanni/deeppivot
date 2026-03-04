"use client";

import { useState } from "react";

type WhyYouMatchTooltipProps = {
  jobId: number;
  className?: string;
};

export function WhyYouMatchTooltip({ jobId, className }: WhyYouMatchTooltipProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [explanation, setExplanation] = useState("");

  async function loadExplanation() {
    if (loading || loaded) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/matches/explain?jobId=${jobId}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to explain match");
      setExplanation(data.explanation ?? "Your profile aligns with this role.");
      setLoaded(true);
    } catch {
      setExplanation("Your profile aligns with this role based on your resume and recent activity.");
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`relative ${className ?? ""}`}
      onMouseEnter={() => {
        setOpen(true);
        void loadExplanation();
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const next = !open;
          setOpen(next);
          if (next) void loadExplanation();
        }}
      >
        Why you match?
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-md border border-white/20 bg-[#141428] p-3 text-left text-xs text-white shadow-xl"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {loading ? "Generating explanation..." : explanation}
        </div>
      )}
    </div>
  );
}
