"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Moon, Sun, ChevronDown, Mic2, UserCircle, MapPin, BarChart3 } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export const Navbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrollY, setScrollY] = useState(0);

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
  const opacity = Math.max(0.92, 1 - scrollY / 300);

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

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/#features"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Features
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  Product
                  <ChevronDown className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <BarChart3 className="size-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/interviews" className="flex items-center gap-2 cursor-pointer">
                    <Mic2 className="size-4" />
                    AI Interviews
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/archetype" className="flex items-center gap-2 cursor-pointer">
                    <UserCircle className="size-4" />
                    Career Archetype
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/career-plan" className="flex items-center gap-2 cursor-pointer">
                    <MapPin className="size-4" />
                    Career Plan
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={toggleDark}
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <AuthSection />
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

const AuthSection = () => {
  const { isSignedIn, user, isLoaded } = useUser();

  if (isLoaded && isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="secondary" size="sm" className="rounded-lg">
            Dashboard
          </Button>
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:inline">
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
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm" className="rounded-lg">
          Sign In
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button
          size="sm"
          className="rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm hover:from-violet-600 hover:to-pink-600"
        >
          Get Started
        </Button>
      </SignUpButton>
    </div>
  );
};
