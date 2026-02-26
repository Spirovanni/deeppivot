import { requireRole } from "@/src/lib/rbac";
import { getCurrentUserRole } from "@/src/lib/rbac";
import {
  Users,
  Star,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MentorDashboardPage() {
  // RBAC guard — only "mentor" and "admin" roles may access this page
  await requireRole("mentor");

  const role = await getCurrentUserRole();

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your learners, schedule sessions, and review interview feedback.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-medium">
          {role === "admin" ? "Admin (Mentor view)" : "Mentor"}
        </Badge>
      </div>

      {/* Coming-soon stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard
          icon={<Users className="size-5 text-muted-foreground" />}
          title="Assigned Learners"
          description="View and manage your learner cohort"
          comingSoon
        />
        <PlaceholderCard
          icon={<MessageSquare className="size-5 text-muted-foreground" />}
          title="Session Reviews"
          description="Review AI interview transcripts and leave feedback"
          comingSoon
        />
        <PlaceholderCard
          icon={<ClipboardList className="size-5 text-muted-foreground" />}
          title="Archetype Queue"
          description="Validate AI-generated career archetype assessments"
          comingSoon
        />
        <PlaceholderCard
          icon={<Calendar className="size-5 text-muted-foreground" />}
          title="Upcoming Sessions"
          description="View scheduled 1:1 coaching sessions"
          comingSoon
        />
        <PlaceholderCard
          icon={<TrendingUp className="size-5 text-muted-foreground" />}
          title="Learner Progress"
          description="Track skill growth and milestone completion"
          comingSoon
        />
        <PlaceholderCard
          icon={<Star className="size-5 text-muted-foreground" />}
          title="My Profile"
          description="Update your mentor bio, specialties, and availability"
          comingSoon
        />
      </div>

      {/* Roadmap notice */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Full mentor tooling — learner assignment, transcript review, and coaching workflows —
          is coming soon. Check back after the next release.
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
