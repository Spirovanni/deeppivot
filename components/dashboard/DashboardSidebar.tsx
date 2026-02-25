"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic2,
  BarChart3,
  UserCircle,
  MapPin,
  Users,
  GraduationCap,
  Briefcase,
  Menu,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/interviews", label: "Interviews", icon: Mic2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/archetype", label: "Career Archetype", icon: UserCircle },
  { href: "/dashboard/career-plan", label: "Career Plan", icon: MapPin },
  { href: "/dashboard/mentors", label: "Mentors", icon: Users },
  { href: "/dashboard/education", label: "Education Explorer", icon: GraduationCap },
  { href: "/dashboard/job-tracker", label: "Job Tracker", icon: Briefcase },
];

function UserButtonPlaceholder() {
  return <div className="size-8 shrink-0 rounded-full bg-muted" aria-hidden />;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          {mounted ? (
            <UserButton
              appearance={{
                elements: { avatarBox: "size-8" },
              }}
            />
          ) : (
            <UserButtonPlaceholder />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {mounted ? "Account" : "User"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
            <span className="font-semibold text-foreground">Deep Pivot</span>
          </Link>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile: header with menu trigger */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-muted/30 px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
                Deep Pivot
              </SheetTitle>
            </SheetHeader>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="font-semibold text-foreground">
          Deep Pivot
        </Link>
        {mounted ? (
          <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
        ) : (
          <UserButtonPlaceholder />
        )}
      </div>
    </>
  );
}
