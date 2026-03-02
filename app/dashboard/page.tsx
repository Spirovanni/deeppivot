import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Mic2,
  BarChart3,
  UserCircle,
  MapPin,
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getArchetype } from "@/src/lib/actions/archetype";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "@/src/lib/actions/dashboard";
import { getPredictiveInsights } from "@/src/lib/actions/predictive-insights";
import {
  CareerArchetypeCard,
  CareerArchetypeEmptyCard,
} from "@/components/dashboard/CareerArchetypeCard";
import { CareerPlanProgressWidget } from "@/components/dashboard/CareerPlanProgressWidget";
import { InterviewSummaryWidget } from "@/components/dashboard/InterviewSummaryWidget";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { RecentInterviewsWidget } from "@/components/dashboard/RecentInterviewsWidget";
import { PredictiveInsightsWidget } from "@/components/dashboard/PredictiveInsightsWidget";
import type { TraitScore } from "@/src/lib/archetypes";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getUserDashboardRoute, type UserRole } from "@/src/lib/rbac";
import { getGamificationStatus } from "@/src/lib/actions/gamification";
import { GamificationHub } from "@/components/dashboard/GamificationHub";

const features = [
  {
    href: "/dashboard/interviews",
    title: "Interviews",
    description: "Practice with AI voice interviews and get emotion feedback.",
    icon: Mic2,
  },
  {
    href: "/dashboard/analytics",
    title: "Analytics",
    description: "Track your progress with detailed performance analytics.",
    icon: BarChart3,
  },
  {
    href: "/dashboard/archetype",
    title: "Career Archetype",
    description: "Discover your unique career persona through AI analysis.",
    icon: UserCircle,
  },
  {
    href: "/dashboard/career-plan",
    title: "Career Plan",
    description: "Build dynamic roadmaps with milestones and resources.",
    icon: MapPin,
  },
  {
    href: "/dashboard/mentors",
    title: "Mentors",
    description: "Connect with industry mentors for personalized guidance.",
    icon: Users,
  },
  {
    href: "/dashboard/education",
    title: "Education Explorer",
    description: "Discover bootcamps, certifications, and funding opportunities.",
    icon: GraduationCap,
  },
  {
    href: "/dashboard/job-tracker",
    title: "Job Tracker",
    description: "Manage your job applications across the hiring pipeline.",
    icon: Briefcase,
  },
];

const emptySummary: DashboardSummary = {
  careerPlan: { total: 0, completed: 0, inProgress: 0 },
  interviews: { total: 0, completed: 0, recent: [] },
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Role-based redirect: send non-default roles to their dedicated dashboard.
  // Skip redirect for admin/system_admin so they can access the user dashboard when they choose it.
  const [row] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  const userRole = (row?.role as UserRole) ?? "user";
  const isSuperUser = userRole === "admin" || userRole === "system_admin";
  if (!isSuperUser && userRole !== "user") {
    redirect(getUserDashboardRoute(userRole));
  }

  let archetype: Awaited<ReturnType<typeof getArchetype>> | null = null;
  let summary: DashboardSummary = emptySummary;
  let predictiveInsights: Awaited<ReturnType<typeof getPredictiveInsights>> | null = null;
  let gamificationStatus: Awaited<ReturnType<typeof getGamificationStatus>> = null;

  try {
    [archetype, summary, predictiveInsights, gamificationStatus] = await Promise.all([
      getArchetype(),
      getDashboardSummary(),
      getPredictiveInsights(),
      getGamificationStatus(),
    ]);
  } catch {
    // Fallback: user may not be in DB yet (webhook delay) or transient DB/API error
    archetype = null;
    summary = emptySummary;
    predictiveInsights = null;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back{user.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your progress. Choose a feature below to get started.
          </p>
        </div>

        {/* First-time user onboarding */}
        <OnboardingBanner
          hasCompletedInterviews={summary.interviews.completed > 0}
          hasArchetype={!!archetype}
          hasCareerPlan={summary.careerPlan.total > 0}
        />

        {/* Progress overview: Career Plan + Interviews + Gamification */}
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <CareerPlanProgressWidget
            total={summary.careerPlan.total}
            completed={summary.careerPlan.completed}
            inProgress={summary.careerPlan.inProgress}
          />
          <InterviewSummaryWidget
            total={summary.interviews.total}
            completed={summary.interviews.completed}
          />
          <GamificationHub status={gamificationStatus} />
        </div>

        {/* Returning user: Recent interviews list */}
        {summary.interviews.recent.length > 0 && (
          <div className="mb-8">
            <RecentInterviewsWidget sessions={summary.interviews.recent} />
          </div>
        )}

        {/* Predictive career insights */}
        {predictiveInsights && predictiveInsights.length > 0 && (
          <div className="mb-8">
            <PredictiveInsightsWidget insights={predictiveInsights} />
          </div>
        )}

        {/* Career Archetype widget */}
        <div className="mb-8">
          {archetype ? (
            <CareerArchetypeCard
              archetypeName={archetype.archetypeName}
              traits={(archetype.traits ?? []) as TraitScore[]}
              strengths={archetype.strengths ?? []}
              growthAreas={archetype.growthAreas ?? []}
              assessedAt={archetype.assessedAt}
            />
          ) : (
            <CareerArchetypeEmptyCard />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className="h-full transition-colors hover:bg-accent/50">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="flex items-center justify-between">
                        {feature.title}
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
