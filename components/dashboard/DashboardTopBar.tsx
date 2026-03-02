"use client";

import { useEffect, useState } from "react";
import { DashboardBreadcrumbs } from "@/components/navigation/DashboardBreadcrumbs";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { StreakBadge } from "@/components/dashboard/StreakBadge";

function UserButtonPlaceholder() {
  return <div className="size-8 shrink-0 rounded-full bg-muted" aria-hidden />;
}

export function DashboardTopBar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between bg-muted/20 px-6 py-3">
        <DashboardBreadcrumbs />
        <div className="flex items-center gap-3">
          <StreakBadge />
          <NotificationDropdown />
          <ThemeToggle />
          {mounted ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8",
                },
              }}
              showName
            />
          ) : (
            <UserButtonPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}
