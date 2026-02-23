"use client";

/**
 * Root-level error boundary. Catches errors in the root layout.
 * Must define its own html/body since the root layout may have failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-400">
            We encountered an unexpected error. Please try again.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-700"
            >
              Go home
            </a>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
