import Link from "next/link";
import { Shield, ClipboardCheck } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the platform and review AI-generated content.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/archetype-review"
          className="flex items-center gap-4 rounded-lg border bg-card p-6 transition-colors hover:bg-muted/50"
        >
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardCheck className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Archetype Review Queue</h2>
            <p className="text-sm text-muted-foreground">
              Review and approve or override AI-assigned career archetypes.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
