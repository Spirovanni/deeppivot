"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4"
      aria-labelledby="unauthorized-heading"
    >
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center" aria-hidden="true">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
            <ShieldX className="size-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1
          id="unauthorized-heading"
          className="text-3xl font-bold text-slate-900 dark:text-slate-100"
        >
          Access Denied
        </h1>

        <p className="mt-3 text-slate-700 dark:text-slate-300">
          You don&apos;t have the required permissions to view this page.
          If you believe this is a mistake, please contact support.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/dashboard">
              <Home className="mr-2 size-4" aria-hidden="true" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
            Go Back
          </Button>
        </div>

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
          <span aria-label="HTTP error code 403 Forbidden">Error code: 403 Forbidden</span>
        </p>
      </div>
    </main>
  );
}
