import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Mic2, BarChart3, UserCircle, MapPin,
    Users, GraduationCap, Briefcase, ArrowRight,
    Trophy, Target, TrendingUp, CheckCircle2,
} from "lucide-react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { getArchetype } from "@/src/lib/actions/archetype";
import { getDashboardSummary, type DashboardSummary } from "@/src/lib/actions/dashboard";
import { CareerArchetypeCard, CareerArchetypeEmptyCard } from "@/components/dashboard/CareerArchetypeCard";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import type { TraitScore } from "@/src/lib/archetypes";

const features = [
    {
        href: "/dashboard/interviews",
        title: "AI Voice Interviews",
        description: "Practice with a realistic AI coach and get real-time feedback.",
        icon: Mic2,
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
        href: "/dashboard/analytics",
        title: "Performance Analytics",
        description: "Track improvement across every session with detailed charts.",
        icon: BarChart3,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
        href: "/dashboard/archetype",
        title: "Career Archetype",
        description: "Discover your unique career persona through AI analysis.",
        icon: UserCircle,
        color: "text-pink-500",
        bg: "bg-pink-50 dark:bg-pink-900/20",
    },
    {
        href: "/dashboard/career-plan",
        title: "Career Roadmap",
        description: "Build your personalized roadmap with milestones and resources.",
        icon: MapPin,
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
        href: "/dashboard/mentors",
        title: "Mentor Network",
        description: "Connect with industry mentors for personalized guidance.",
        icon: Users,
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
        href: "/dashboard/education",
        title: "Education Explorer",
        description: "Browse bootcamps, certifications, and funding opportunities.",
        icon: GraduationCap,
        color: "text-teal-500",
        bg: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
        href: "/dashboard/job-tracker",
        title: "Job Tracker",
        description: "Manage all your applications across the hiring pipeline.",
        icon: Briefcase,
        color: "text-indigo-500",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
];

const emptySummary: DashboardSummary = {
    careerPlan: { total: 0, completed: 0, inProgress: 0 },
    interviews: { total: 0, completed: 0, recent: [] },
};

export default async function TrailblazerDashboardPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    let archetype: Awaited<ReturnType<typeof getArchetype>> | null = null;
    let summary: DashboardSummary = emptySummary;

    try {
        [archetype, summary] = await Promise.all([getArchetype(), getDashboardSummary()]);
    } catch {
        archetype = null;
        summary = emptySummary;
    }

    const avgScore =
        summary.interviews.recent.length > 0
            ? Math.round(
                summary.interviews.recent
                    .filter((s) => s.overallScore !== null)
                    .reduce((acc, s) => acc + (s.overallScore ?? 0), 0) /
                Math.max(summary.interviews.recent.filter((s) => s.overallScore !== null).length, 1)
            )
            : null;

    const careerPlanPct =
        summary.careerPlan.total > 0
            ? Math.round((summary.careerPlan.completed / summary.careerPlan.total) * 100)
            : 0;

    const stats = [
        {
            label: "Interviews Done",
            value: summary.interviews.completed,
            icon: Mic2,
            color: "text-violet-500",
            bg: "bg-violet-50 dark:bg-violet-900/20",
            sub: `${summary.interviews.total} total`,
        },
        {
            label: "Avg Score",
            value: avgScore !== null ? `${avgScore}%` : "—",
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            sub: "across recent sessions",
        },
        {
            label: "Career Plan",
            value: `${careerPlanPct}%`,
            icon: Target,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            sub: `${summary.careerPlan.completed}/${summary.careerPlan.total} milestones`,
        },
        {
            label: "Archetype",
            value: archetype ? archetype.archetypeName.split(" ").pop() ?? "Found" : "Undiscovered",
            icon: UserCircle,
            color: "text-pink-500",
            bg: "bg-pink-50 dark:bg-pink-900/20",
            sub: archetype ? "Unlocked" : "Complete 3 interviews",
        },
    ];

    return (
        <div className="p-6 md:p-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300 mb-3">
                        🚀 Trailblazer Dashboard
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Welcome back{user.firstName ? `, ${user.firstName}` : ""}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Your career journey at a glance.
                    </p>
                </div>

                {/* Onboarding */}
                <OnboardingBanner
                    hasCompletedInterviews={summary.interviews.completed > 0}
                    hasArchetype={!!archetype}
                    hasCareerPlan={summary.careerPlan.total > 0}
                />

                {/* Stats grid */}
                <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
                        >
                            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                                <s.icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
                            <div className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">{s.label}</div>
                            <div className="mt-0.5 text-xs text-slate-400">{s.sub}</div>
                        </div>
                    ))}
                </div>

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

                {/* Feature nav */}
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Your Tools</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((f) => (
                        <Link key={f.href} href={f.href}>
                            <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md hover:bg-accent/30">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${f.bg}`}>
                                        <f.icon className={`size-5 ${f.color}`} />
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                            {f.title}
                                            <ArrowRight className="size-4 text-muted-foreground" />
                                        </CardTitle>
                                        <CardDescription className="text-xs leading-relaxed">{f.description}</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
