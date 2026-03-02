"use client";

import { HeroSection } from "./_components/hero-section";
import { FeatureBentoGrid } from "./_components/feature-bento-grid";
import { PathChooser } from "./_components/path-chooser";
import { GamificationSection } from "./_components/gamification-section";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Sparkles, Bell } from "lucide-react";

interface PageProps { }

export default function Page({ }: PageProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();

  // Handle Get Started button - redirect to interviews page
  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-up');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection onGetStarted={handleGetStarted} />

      {/* Path chooser — job seeker vs employer */}
      <PathChooser />

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

      {/* Gamification Section */}
      <GamificationSection />

      {/* Real-time Notification Mockup (Sticky/Floating) */}
      <div className="fixed bottom-8 left-8 z-50 hidden lg:block">
        <div className="group relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 opacity-25 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
          <div className="relative flex items-center gap-4 rounded-xl border border-white/20 bg-white/80 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
              <Bell className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">New Interview Ready!</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Your AI coach Sarah is waiting.</div>
            </div>
            <div className="ml-2 h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Employer Proposition Section */}
      <section className="relative w-full overflow-hidden bg-white py-24 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left side text */}
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Looking to hire vetted, highly-motivated talent?
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Join our exclusive <strong>Employer Portal</strong> to post jobs directly to our ecosystem.
                Review AI-assessed interview performance, career archetypes, and verified skills before making your next hire.
              </p>

              <div className="mt-8">
                <ul className="space-y-4 text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-violet-100 p-1 dark:bg-violet-900/50">
                      <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span>Zero recruiting friction — post directly into the user&apos;s Job Tracker workflow.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-pink-100 p-1 dark:bg-pink-900/50">
                      <svg className="h-5 w-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span>Comprehensive candidate insights, not just a resume.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10">
                <button
                  onClick={() => router.push('/sign-up')}
                  className="rounded-xl border-2 border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700/50"
                >
                  Create an Employer Account
                </button>
              </div>
            </div>

            {/* Right side visual representation */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative rounded-2xl bg-gradient-to-br from-violet-100 to-pink-50 p-8 shadow-xl dark:from-violet-900/40 dark:to-pink-900/20 w-full max-w-md ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="space-y-6">
                  {/* Mock applicant card 1 */}
                  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div>
                          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="h-3 w-16 rounded bg-violet-100 dark:bg-violet-900/50 text-[10px] font-medium text-violet-700 dark:text-violet-300 leading-none px-1 flex items-center justify-center">The Innovator</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        Interview Score: 92%
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="rounded bg-slate-50 px-2 py-1.5 dark:bg-slate-900/50 text-center">Communication: High</div>
                      <div className="rounded bg-slate-50 px-2 py-1.5 dark:bg-slate-900/50 text-center">Tech Fit: 9.5/10</div>
                    </div>
                  </div>

                  {/* Mock applicant card 2 */}
                  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700 opacity-60">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div>
                          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700"></div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="h-3 w-20 rounded bg-blue-100 dark:bg-blue-900/50 text-[10px] font-medium text-blue-700 dark:text-blue-300 leading-none px-1 flex items-center justify-center">The Strategist</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        Interviewing
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
