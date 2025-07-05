"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import HumeLogo from "./logos/Hume";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import Github from "./logos/GitHub";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import pkg from '@/package.json';

export const Nav = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useLayoutEffect(() => {
    setIsClient(true);
    const el = document.documentElement;

    if (el.classList.contains("dark")) {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, []);

  const toggleDark = () => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    setIsDarkMode((prev) => !prev);
  };

  return (
    <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      {/* <div className={"ml-auto flex items-center gap-1"}> */}

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
      {/* </div> */}
    </nav>
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
        {/* @ts-expect-error Clerk types do not support render prop, but it works */}
        {({ openModal }) => (
          <Button className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0" variant="signIn" onClick={openModal}>
            Sign In
          </Button>
        )}
      </SignInButton>
      <SignUpButton mode="modal">
        <Button className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
          Get Started
        </Button>
      </SignUpButton>
    </div>
  );
};
