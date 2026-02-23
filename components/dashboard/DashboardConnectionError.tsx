"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RefreshCw, WifiOff } from "lucide-react";

export function DashboardConnectionError() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-muted">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-500/10">
            <WifiOff className="size-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold">Connection issue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t sync your account. This is usually temporary.
            Click below to try again.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={handleRetry}
          >
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
