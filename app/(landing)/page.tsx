"use client";

import { HeroSection } from "./_components/hero-section";
import { FeatureBentoGrid } from "./_components/feature-bento-grid";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

interface PageProps {}

export default function Page({}: PageProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();

  // Handle Get Started button - redirect to interviews page
  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/dashboard/interviews');
    } else {
      router.push('/sign-up');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection onGetStarted={handleGetStarted} />
      
      {/* FeatureBentoGrid with proper spacing */}
      <section
        id="features"
        data-features-section
        className="relative w-full bg-slate-50 py-24 dark:bg-slate-950 lg:py-32"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-sm dark:border-violet-800 dark:bg-slate-900/80 dark:text-violet-300">
              <Sparkles className="h-4 w-4" />
              Complete Career Development Suite
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Everything you need to
              <span className="block bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                accelerate your career
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              From AI-powered interview practice to personalized career planning and workforce development.
            </p>
          </div>
          <FeatureBentoGrid />
        </div>
      </section>

      {/* Authentication Gate for Premium Features */}
      {!isSignedIn && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-violet-600 via-pink-600 to-violet-700 py-24">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute -left-20 top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-20 bottom-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
            <h2 className="text-4xl font-bold text-white sm:text-5xl">
              Ready to transform your career?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
              Join thousands of professionals leveraging AI to practice interviews, develop skills, and accelerate their career growth.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <div className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm text-white backdrop-blur-sm">
                🔒 Free account required for premium features
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
