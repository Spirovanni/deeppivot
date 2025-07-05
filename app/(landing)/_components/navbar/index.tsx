"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export const Navbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  useLayoutEffect(() => {
    setIsClient(true);
    const el = document.documentElement;

    if (el.classList.contains("dark")) {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDark = () => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    setIsDarkMode((prev) => !prev);
  };

  // Calculate opacity and shadow based on scroll position
  const isScrolled = scrollY > 10;
  const opacity = Math.max(0.85, 1 - (scrollY / 200)); // Gradually becomes more transparent, minimum 85%

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 flex w-full items-center justify-between border-b px-4 py-4 backdrop-blur-sm transition-all duration-300 ${
        isScrolled 
          ? 'border-neutral-200/50 dark:border-neutral-800/50 shadow-lg' 
          : 'border-neutral-200 dark:border-neutral-800 shadow-none'
      }`}
      style={{
        backgroundColor: isDarkMode 
          ? `rgba(0, 0, 0, ${opacity})` 
          : `rgba(255, 255, 255, ${opacity})`
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
        <h1 className="text-base font-bold md:text-2xl">Deep Pivots</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={toggleDark}
          variant={"ghost"}
          className={"flex items-center gap-1.5 rounded-full"}
        >
          <span>
            {isDarkMode ? (
              <Sun className={"size-4"} />
            ) : (
              <Moon className={"size-4"} />
            )}
          </span>
          <span>{isDarkMode ? "Light" : "Dark"} Mode</span>
        </Button>
        
        {isClient && <AuthSection />}
      </div>
    </motion.nav>
  );
};

// Separate component for auth section to handle Clerk hooks properly
const AuthSection = () => {
  const { isSignedIn, user } = useUser();
  
  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Welcome, {user?.firstName || user?.username}!
        </span>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button 
          variant="ghost" 
          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Sign In
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
          Get Started
        </Button>
      </SignUpButton>
    </div>
  );
};