import { Suspense } from "react";
import { AltEdExplorer } from "./_components/AltEdExplorer";
import { getPrograms, getFunding } from "@/src/lib/actions/education";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alt-Ed Explorer | Deep Pivot",
  description:
    "Search and compare 500+ alternative education programs — bootcamps, certifications, and trade training — to find the right path for your career.",
};

export const dynamic = "force-dynamic";

export default async function AltEdPage() {
  const [programs, funding] = await Promise.all([
    getPrograms(),
    getFunding(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<ExplorerSkeleton />}>
        <AltEdExplorer initialPrograms={programs} fundingOpportunities={funding} />
      </Suspense>
    </div>
  );
}

function ExplorerSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
      <div className="h-8 w-64 rounded bg-muted mb-2" />
      <div className="h-4 w-96 rounded bg-muted mb-8" />
      <div className="flex gap-6">
        <div className="hidden lg:block w-64 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="flex-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-56 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
