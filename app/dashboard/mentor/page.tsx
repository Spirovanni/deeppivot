import { requireRole } from "@/src/lib/rbac";
import { getCurrentUserRole } from "@/src/lib/rbac";
import { getMentorLearners, getMentorReferrals, getMentorResources } from "@/src/lib/actions/mentor-tools";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { MentorDashboardClient } from "./_components/MentorDashboardClient";

export const dynamic = "force-dynamic";

export default async function MentorDashboardPage() {
  await requireRole("mentor");
  const role = await getCurrentUserRole();

  // Load all mentor data in parallel
  const [learners, referrals, resources] = await Promise.all([
    getMentorLearners().catch(() => []),
    getMentorReferrals().catch(() => []),
    getMentorResources().catch(() => []),
  ]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Review learner sessions, manage referrals, and share resources.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-medium">
          {role === "admin" ? "Admin (Mentor view)" : "Mentor"}
        </Badge>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <MentorDashboardClient
          initialLearners={learners}
          initialReferrals={referrals}
          initialResources={resources}
        />
      </Suspense>
    </div>
  );
}
