import { requireRole, getCurrentUserRole } from "@/src/lib/rbac";
import {
  getWdbCohortStats,
  getWdbArchetypeBreakdown,
  getWdbSessionTrend,
  getWdbMilestoneBreakdown,
  getWdbLearnerRoster,
} from "@/src/lib/actions/wdb-analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BarChart3,
  Mic2,
  TrendingUp,
  CheckCircle2,
  Target,
  Star,
  Activity,
  PlusCircle,
  RefreshCw,
  Network,
} from "lucide-react";
import { WdbChartsClient } from "./_components/WdbChartsClient";
import { WdbRosterClient } from "./_components/WdbRosterClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WDB Partner Dashboard | Deep Pivot",
};

export const dynamic = "force-dynamic";

export default async function WdbDashboardPage() {
  await requireRole("wdb_partner");
  const role = await getCurrentUserRole();

  const [stats, archetypes, sessionTrend, milestones, roster] = await Promise.all([
    getWdbCohortStats().catch(() => null),
    getWdbArchetypeBreakdown().catch(() => []),
    getWdbSessionTrend(30).catch(() => []),
    getWdbMilestoneBreakdown().catch(() => []),
    getWdbLearnerRoster().catch(() => []),
  ]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WDB Partner Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Cohort performance overview for your Workforce Development Board region.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs font-medium">
            {role === "admin" ? "Admin (WDB view)" : "WDB Partner"}
          </Badge>
          <div className="hidden sm:flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="#">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Referral
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="#">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Salesforce
              </Link>
            </Button>
            <Button size="sm" variant="default" asChild>
              <Link href="#">
                <Network className="mr-2 h-4 w-4" />
                Partner Network
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile action buttons */}
      <div className="flex sm:hidden items-center gap-2 overflow-x-auto pb-2">
        <Button size="sm" variant="outline" className="shrink-0" asChild>
          <Link href="#">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Referral
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="shrink-0" asChild>
          <Link href="#">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Salesforce
          </Link>
        </Button>
        <Button size="sm" variant="default" className="shrink-0" asChild>
          <Link href="#">
            <Network className="mr-2 h-4 w-4" />
            Partner Network
          </Link>
        </Button>
      </div>

      {/* Cohort summary stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users className="size-4 text-blue-500" />}
            label="Total Learners"
            value={stats.totalLearners}
            description="in your WDB cohort"
          />
          <StatCard
            icon={<Mic2 className="size-4 text-violet-500" />}
            label="Total Sessions"
            value={stats.totalSessions}
            description={`avg ${stats.avgSessionsPerLearner} per learner`}
          />
          <StatCard
            icon={<CheckCircle2 className="size-4 text-emerald-500" />}
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            description="of sessions completed"
          />
          <StatCard
            icon={<Star className="size-4 text-amber-500" />}
            label="Career Archetypes"
            value={stats.learnersWithArchetype}
            description={`of ${stats.totalLearners} assessed`}
          />
        </div>
      )}

      {/* Charts section */}
      <WdbChartsClient
        archetypes={archetypes}
        sessionTrend={sessionTrend}
        milestones={milestones}
        stats={stats}
      />

      {/* Secondary metrics */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.learnersWithSessions}</p>
              <p className="text-xs text-muted-foreground">have completed at least 1 session</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Target className="size-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.learnersWithMilestones}</p>
              <p className="text-xs text-muted-foreground">learners have active milestones</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-sm font-medium">Archetype Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.totalLearners > 0
                  ? `${Math.round((stats.learnersWithArchetype / stats.totalLearners) * 100)}%`
                  : "0%"}
              </p>
              <p className="text-xs text-muted-foreground">of learners assessed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!stats && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <BarChart3 className="size-8 mx-auto mb-3 text-muted-foreground opacity-50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No cohort data yet. Data will appear here once learners are connected to mentors
            in your WDB region.
          </p>
        </div>
      )}

      {/* Roster Table */}
      {stats && (
        <WdbRosterClient roster={roster} />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </CardContent>
    </Card>
  );
}
