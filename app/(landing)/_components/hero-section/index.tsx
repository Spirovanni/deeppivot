"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState, useLayoutEffect } from "react";
import { Sparkles, Zap, TrendingUp } from "lucide-react";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [isClient, setIsClient] = useState(false);

  useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToChat = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      const windowHeight = window.innerHeight;
      const targetScroll = windowHeight * 2;

      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });

      setTimeout(() => {
        const chatSection = document.getElementById('chat-section');
        if (chatSection) {
          chatSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 1000);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-500/10" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-pink-200/30 blur-3xl dark:bg-pink-500/10" />
        <div className="absolute bottom-0 right-1/4 h-60 w-60 rounded-full bg-blue-200/20 blur-3xl dark:bg-blue-500/10" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-8 px-6 py-12 lg:grid-cols-2 lg:gap-12 lg:px-8">
        {/* Left side - Content */}
        <div className="flex flex-col justify-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-sm dark:border-violet-800 dark:bg-slate-900/80 dark:text-violet-300">
              <Sparkles className="h-4 w-4" />
              Powered by Epicarcana FlowArcs
            </div>
          </motion.div>

          {/* Main heading */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl"
            >
              Transform Your
              <span className="block bg-gradient-to-r from-violet-600 via-pink-600 to-violet-600 bg-clip-text text-transparent">
                Career Journey
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl leading-relaxed text-slate-600 dark:text-slate-300"
            >
              AI-powered voice interviews with emotional intelligence, career archetyping, and personalized development paths.
            </motion.p>
          </div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Zap className="h-4 w-4 text-violet-500" />
              &lt;800ms Latency
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <TrendingUp className="h-4 w-4 text-pink-500" />
              Real-time Emotion AI
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4"
          >
            {isClient && <HeroButtons onGetStarted={scrollToChat} />}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-3 gap-6 pt-8"
          >
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">500+</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">Education Programs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">6</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">Career Archetypes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">AI</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">Voice Coach</div>
            </div>
          </motion.div>
        </div>

        {/* Right side - Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative flex items-center justify-center lg:justify-end"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-600 via-pink-600 to-violet-600 opacity-20 blur-2xl" />

            {/* Image container */}
            <div className="relative rounded-2xl border border-slate-200/50 bg-white/80 p-3 shadow-2xl backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/80">
              <Image
                src="/landing-mock.png"
                alt="Deep Pivot interview coaching platform"
                width={600}
                height={900}
                className="aspect-[2/3] w-full rounded-xl object-cover"
                priority
              />
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -right-4 bottom-[516px] rounded-xl border border-violet-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm dark:border-violet-800 dark:bg-slate-900/90"
            >
              <div className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                FlowArcs Integration
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300">Workflow automation ready</div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -left-4 bottom-32 rounded-xl border border-pink-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm dark:border-pink-800 dark:bg-slate-900/90"
            >
              <div className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                Voice AI Coach
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300">Powered by ElevenLabs</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Separate component for hero buttons to handle Clerk hooks properly
const HeroButtons = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <>
        <button
          onClick={onGetStarted}
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-violet-700 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="relative">Start Practice Session</span>
        </button>
        <button
          onClick={() => {
            const featuresSection = document.querySelector('[data-features-section]');
            if (featuresSection) {
              featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-900 shadow-sm transition-all hover:border-slate-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500"
        >
          Explore Features
        </button>
      </>
    );
  }

  return (
    <>
      <SignUpButton mode="modal">
        <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl">
          <span className="absolute inset-0 bg-gradient-to-r from-violet-700 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="relative">Get Started Free</span>
        </button>
      </SignUpButton>
      <button
        onClick={() => {
          const featuresSection = document.querySelector('[data-features-section]');
          if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-900 shadow-sm transition-all hover:border-slate-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500"
      >
        Explore Features
      </button>
    </>
  );
};