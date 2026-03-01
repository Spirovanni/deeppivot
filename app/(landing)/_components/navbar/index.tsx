"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useState, useEffect } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Moon,
  Sun,
  ChevronDown,
  Mic2,
  UserCircle,
  MapPin,
  BarChart3,
  Menu,
  Briefcase,
  Users,
  Shield,
  GraduationCap,
  FileText,
  Target,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { getUserProfile } from "@/src/lib/actions/profile";

type UserRole = "user" | "mentor" | "wdb_partner" | "enterprise_manager" | "employer" | "admin" | "system_admin";

/** Client-side dashboard route map (mirrors server-side getUserDashboardRoute) */
function getDashboardRoute(role: UserRole | null): string {
  switch (role) {
    case "employer":
      return "/dashboard/talent-scout";
    case "mentor":
      return "/dashboard/mentor";
    case "wdb_partner":
    case "enterprise_manager":
      return "/dashboard/wdb";
    case "admin":
    case "system_admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}

/** Returns a display label for the dashboard button based on role */
function getDashboardLabel(role: UserRole | null): string {
  switch (role) {
    case "employer":
      return "Talent Scout";
    case "mentor":
      return "Mentor Hub";
    case "wdb_partner":
    case "enterprise_manager":
      return "WDB Portal";
    case "admin":
    case "system_admin":
      return "Admin Panel";
    default:
      return "Dashboard";
  }
}

/** Role-specific product dropdown items */
function getProductItems(role: UserRole | null) {
  switch (role) {
    case "employer":
      return [
        { href: "/dashboard/talent-scout", label: "Talent Scout Dashboard", icon: Target },
        { href: "/dashboard/talent-scout/jobs", label: "Post & Manage Jobs", icon: Briefcase },
        { href: "/dashboard/talent-scout/onboarding", label: "Employer Onboarding", icon: FileText },
      ];
    case "mentor":
      return [
        { href: "/dashboard/mentor", label: "Mentor Dashboard", icon: Users },
        { href: "/dashboard/mentors", label: "My Mentees", icon: UserCircle },
      ];
    case "admin":
    case "system_admin":
      return [
        { href: "/admin", label: "Admin Panel", icon: Shield },
        { href: "/dashboard", label: "User Dashboard", icon: BarChart3 },
        { href: "/dashboard/interviews", label: "AI Interviews", icon: Mic2 },
      ];
    default:
      return [
        { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
        { href: "/dashboard/interviews", label: "AI Interviews", icon: Mic2 },
        { href: "/dashboard/archetype", label: "Career Archetype", icon: UserCircle },
        { href: "/dashboard/career-plan", label: "Career Plan", icon: MapPin },
        { href: "/dashboard/job-tracker", label: "Job Tracker", icon: Briefcase },
        { href: "/dashboard/education", label: "Education Explorer", icon: GraduationCap },
      ];
  }
}

export const Navbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useLayoutEffect(() => {
    const el = document.documentElement;
    setIsDarkMode(el.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode((prev) => !prev);
  };

  const isScrolled = scrollY > 10;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Navbar */}
      <motion.nav
        className="flex w-full items-center justify-between border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{
          boxShadow: isScrolled ? "0 1px 3px 0 rgb(0 0 0 / 0.05)" : "none",
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 shadow-sm" />
            <span className="text-lg font-semibold tracking-tight">Deep Pivot</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/#features"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Features
            </Link>

            <ProductDropdown />

            <Link
              href="/pricing"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Pricing
            </Link>

            <Link
              href="/blog"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Blog
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            onClick={toggleDark}
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <LanguageSwitcher />

          <AuthSection />

          {/* Mobile hamburger */}
          <MobileMenu
            open={mobileOpen}
            onOpenChange={setMobileOpen}
            isDarkMode={isDarkMode}
            toggleDark={toggleDark}
          />
        </div>
      </motion.nav>

      {/* Breadcrumbs */}
      <div className="border-b border-border/40 bg-muted/20 px-4 py-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Career Platform</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
};

/** Hook to fetch user role from the DB (only when signed in) */
function useUserRole() {
  const { isSignedIn, isLoaded } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setRole(null);
      return;
    }
    let cancelled = false;
    getUserProfile()
      .then((profile) => {
        if (!cancelled) setRole((profile.role as UserRole) ?? "user");
      })
      .catch(() => {
        if (!cancelled) setRole("user");
      });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  return role;
}

/** Role-aware Product dropdown */
const ProductDropdown = () => {
  const role = useUserRole();
  const items = getProductItems(role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <button suppressHydrationWarning className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          Product
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                <Icon className="size-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AuthSection = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const role = useUserRole();

  if (isLoaded && isSignedIn) {
    const dashboardRoute = getDashboardRoute(role);
    const dashboardLabel = getDashboardLabel(role);

    return (
      <div className="flex items-center gap-3">
        <Link href={dashboardRoute} className="hidden sm:block">
          <Button variant="secondary" size="sm" className="rounded-lg">
            {dashboardLabel}
          </Button>
        </Link>
        <span className="hidden text-sm text-muted-foreground lg:inline">
          {user?.firstName || user?.username}
        </span>
        <UserButton
          appearance={{
            elements: { avatarBox: "size-8 ring-1 ring-border" },
          }}
        />
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link href="/sign-in">
        <Button variant="ghost" size="sm" className="rounded-lg">
          Sign In
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button
          size="sm"
          className="rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm hover:from-violet-600 hover:to-pink-600"
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
};

/** Mobile Sheet menu — visible only on small screens */
const MobileMenu = ({
  open,
  onOpenChange,
  isDarkMode,
  toggleDark,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isDarkMode: boolean;
  toggleDark: () => void;
}) => {
  const { isSignedIn, isLoaded } = useUser();
  const role = useUserRole();
  const productItems = getProductItems(role);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500" />
            Deep Pivot
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 p-4">
          {/* Top-level links */}
          <MobileNavLink href="/#features" onClick={() => onOpenChange(false)}>
            Features
          </MobileNavLink>
          <MobileNavLink href="/pricing" onClick={() => onOpenChange(false)}>
            Pricing
          </MobileNavLink>
          <MobileNavLink href="/blog" onClick={() => onOpenChange(false)}>
            Blog
          </MobileNavLink>

          {/* Separator */}
          <div className="my-2 border-t border-border" />

          {/* Product items */}
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Product
          </p>
          {productItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Icon className="size-4 text-muted-foreground" />
                {item.label}
              </Link>
            );
          })}

          {/* Separator */}
          <div className="my-2 border-t border-border" />

          {/* Auth / dashboard actions */}
          {isLoaded && isSignedIn ? (
            <Link
              href={getDashboardRoute(role)}
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              {getDashboardLabel(role)}
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/sign-in"
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleDark}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/** Simple styled link for mobile nav */
const MobileNavLink = ({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
  >
    {children}
  </Link>
);
