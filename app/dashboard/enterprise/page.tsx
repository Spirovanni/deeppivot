import { requireEnterpriseManager } from "@/src/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, FileText, Download, Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enterprise Dashboard | Deep Pivot",
};

export const dynamic = "force-dynamic";

export default async function EnterpriseDashboardPage() {
  const manager = await requireEnterpriseManager();

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Read-only view of your organization's learner cohort.
            {manager.orgId && (
              <span className="ml-1 text-xs text-muted-foreground">
                Org: <code className="font-mono">{manager.orgId}</code>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-medium flex items-center gap-1">
            <Lock className="size-3" aria-hidden="true" />
            Read-only
          </Badge>
          <Badge variant="outline" className="text-xs font-medium capitalize">
            {manager.role === "admin" ? "Admin (Enterprise view)" : "Enterprise Manager"}
          </Badge>
        </div>
      </div>

      {/* Permission notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Access scope:</strong> You have read-only visibility into learner profiles and
          session summaries within your organization's cohort. You cannot view or modify data
          from other organizations.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard
          icon={<Users className="size-5 text-blue-500" />}
          title="Cohort Overview"
          description="Browse your org's enrolled learners, completion rates, and skill profiles"
          permission="cohort:read"
          available
        />
        <FeatureCard
          icon={<TrendingUp className="size-5 text-emerald-500" />}
          title="Aggregated Insights"
          description="View anonymized analytics on interview performance and skill gaps across your cohort"
          permission="insights:read"
          available
        />
        <FeatureCard
          icon={<FileText className="size-5 text-violet-500" />}
          title="Session Summaries"
          description="Review high-level interview session summaries (no recordings or transcripts)"
          permission="sessions:read"
          available
        />
        <FeatureCard
          icon={<Download className="size-5 text-amber-500" />}
          title="Export Reports"
          description="Export cohort progress reports as CSV or PDF for internal reporting"
          permission="cohort:export"
          available
        />
      </div>

      {/* Coming soon notice */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Enterprise cohort views and export tooling are coming soon.
          Your access is confirmed and data will populate as learners complete assessments.
        </p>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  permission: string;
  available?: boolean;
}

function FeatureCard({ icon, title, description, permission, available }: FeatureCardProps) {
  return (
    <Card className={available ? "" : "opacity-50"}>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        {icon}
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">{description}</p>
        <code className="text-xs text-muted-foreground font-mono">{permission}</code>
        {!available && (
          <Badge variant="outline" className="text-xs">No access</Badge>
        )}
      </CardContent>
    </Card>
  );
}
