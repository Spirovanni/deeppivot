"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Deep Pivots
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome back! Sign in to continue your AI coaching journey.
          </p>
        </div>
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
