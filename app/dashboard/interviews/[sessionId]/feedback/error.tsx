"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function FeedbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log full error in dev for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("[Feedback page error]", {
        message: error.message,
        digest: error.digest,
        cause: error.cause,
        stack: error.stack,
      });
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg border-destructive/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Couldn&apos;t load feedback</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Something went wrong loading this feedback. Try again or return to the session.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <pre className="mt-2 max-h-24 overflow-auto rounded bg-muted p-2 text-xs text-destructive">
              {error.message}
            </pre>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard/interviews">
              <ArrowLeft className="mr-2 size-4" />
              Back to interviews
            </Link>
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
