"use client";

import { DashboardBreadcrumbs } from "@/components/navigation/DashboardBreadcrumbs";

export function DashboardTopBar() {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="bg-muted/20">
        <DashboardBreadcrumbs />
      </div>
    </div>
  );
}
