"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md border-destructive/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We encountered an unexpected error. Please try again or return to the
            homepage.
          </p>
          {isDev && (
            <p className="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              {error.message}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/">
              <Home className="mr-2 size-4" />
              Go home
            </Link>
          </Button>
          <Button className="flex-1" onClick={reset}>
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
