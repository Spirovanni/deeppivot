import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Subscription Confirmed — Deep Pivot",
};

export default function BillingSuccessPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle2 className="size-10 text-green-600" aria-hidden="true" />
      </div>

      <div className="max-w-sm space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          You&apos;re all set!
        </h1>
        <p className="text-muted-foreground">
          Your subscription is now active. All Pro features are unlocked and
          ready to use.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/dashboard/interviews">Start an Interview</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/billing">View Billing</Link>
        </Button>
      </div>
    </div>
  );
}
