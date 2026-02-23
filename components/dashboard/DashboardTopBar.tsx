"use client";

import { DashboardBreadcrumbs } from "@/components/navigation/DashboardBreadcrumbs";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

export function DashboardTopBar() {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between bg-muted/20 px-6 py-3">
        <DashboardBreadcrumbs />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
            showName
          />
        </div>
      </div>
    </div>
  );
}
