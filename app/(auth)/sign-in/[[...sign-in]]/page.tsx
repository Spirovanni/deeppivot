"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CLERK_LOAD_TIMEOUT_MS = 15000;

export default function Page() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [clerkLoadFailed, setClerkLoadFailed] = React.useState(false);

  React.useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setClerkLoadFailed(true), CLERK_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isLoaded]);

  const signInWithOAuth = (strategy: "oauth_google") => {
    if (!signIn) return;
    setError("");
    signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/dashboard",
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setError("");
    setLoading(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.push("/dashboard");
      } else if (attempt.status === "needs_second_factor") {
        setError("Please check your email for a verification code.");
      } else {
        setError("Sign-in incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors: Array<{ message?: string }> }).errors?.[0]
              ?.message
          : err instanceof Error
            ? err.message
            : "Sign-in failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    if (clerkLoadFailed) {
      const isDevMode =
        typeof window !== "undefined" &&
        (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") ||
          process.env.NEXT_PUBLIC_CLERK_USE_DEVELOPMENT === "true");
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
          <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/50">
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
              Authentication failed to load
            </h2>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {isDevMode
                ? "Clerk is taking too long to load. Try:"
                : "This is usually caused by a CORS or domain mismatch. Try:"}
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-300">
              {isDevMode ? (
                <>
                  <li>Disable ad blockers or try an incognito/private window</li>
                  <li>Check your internet connection</li>
                  <li>Ensure the site is not blocked by a firewall or corporate proxy</li>
                </>
              ) : (
                <>
                  <li>
                    Use <strong>deeppivots.com</strong> (without www) instead of
                    www.deeppivots.com
                  </li>
                  <li>
                    Add <strong>www.deeppivots.com</strong> to Clerk Dashboard →
                    Configure → Domains
                  </li>
                  <li>
                    Ensure <strong>clerk.deeppivots.com</strong> DNS is configured
                    per Clerk Dashboard
                  </li>
                </>
              )}
            </ul>
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
            <Link href="/" className="mt-3 block text-center text-sm text-amber-600 hover:underline dark:text-amber-400">
              ← Back to home
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-violet-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading…
          </p>
        </div>
      </div>
    );
  }

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

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}

          {/* OAuth buttons */}
          {signIn && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signInWithOAuth("oauth_google")}
              >
                Continue with Google
              </Button>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Or with email
              </span>
            </div>
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
