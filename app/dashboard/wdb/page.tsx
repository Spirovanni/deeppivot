import { requireRole } from "@/src/lib/rbac";
import { getCurrentUserRole } from "@/src/lib/rbac";
import {
  BarChart3,
  Users,
  Briefcase,
  FileText,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function WdbDashboardPage() {
  // RBAC guard — only "wdb_partner" and "admin" roles may access this page
  await requireRole("wdb_partner");

  const role = await getCurrentUserRole();

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Workforce Development Board Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor referral pipelines, track learner outcomes, and manage regional program data.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-medium">
          {role === "admin" ? "Admin (WDB view)" : "WDB Partner"}
        </Badge>
      </div>

      {/* Coming-soon stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard
          icon={<Users className="size-5 text-muted-foreground" />}
          title="Referral Pipeline"
          description="Track learners referred from your WDB region"
          comingSoon
        />
        <PlaceholderCard
          icon={<BarChart3 className="size-5 text-muted-foreground" />}
          title="Outcome Analytics"
          description="View placement rates, avg. time-to-hire, and wage data"
          comingSoon
        />
        <PlaceholderCard
          icon={<Briefcase className="size-5 text-muted-foreground" />}
          title="Employer Partners"
          description="Manage employer relationships and job postings"
          comingSoon
        />
        <PlaceholderCard
          icon={<MapPin className="size-5 text-muted-foreground" />}
          title="Regional Programs"
          description="Browse alt-ed and training programs available in your region"
          comingSoon
        />
        <PlaceholderCard
          icon={<FileText className="size-5 text-muted-foreground" />}
          title="Reports"
          description="Generate WIOA compliance and outcome reports"
          comingSoon
        />
        <PlaceholderCard
          icon={<TrendingUp className="size-5 text-muted-foreground" />}
          title="Labor Market Data"
          description="Real-time demand signals and wage benchmarks by occupation"
          comingSoon
        />
      </div>

      {/* Roadmap notice */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Full WDB partner tools — referral tracking, WIOA reporting, and regional labor data
          dashboards — are under active development. Check back in the next release.
        </p>
      </div>
    </div>
  );
}

interface PlaceholderCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  comingSoon?: boolean;
}

function PlaceholderCard({ icon, title, description, comingSoon }: PlaceholderCardProps) {
  return (
    <Card className="relative overflow-hidden opacity-80">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        {icon}
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {comingSoon && (
          <Badge variant="outline" className="ml-auto text-xs">
            Coming soon
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
