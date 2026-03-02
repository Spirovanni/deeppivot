import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Briefcase, Users, TrendingUp, Star,
    PlusCircle, Building2, BarChart3, ArrowRight, Clock,
    CheckCircle2, UserCircle,
} from "lucide-react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { getEmployerDashboardStats } from "@/src/lib/actions/employer-dashboard";
import { getTopCandidateMatches } from "@/src/lib/actions/matching";


const features = [
    {
        href: "/employer/jobs/new",
        title: "Post a Job",
        description: "Publish a new role directly into candidates' job trackers.",
        icon: PlusCircle,
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        highlight: true,
    },
    {
        href: "/employer/jobs",
        title: "Manage Jobs",
        description: "View, edit, and close your published job listings.",
        icon: Briefcase,
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
        href: "/employer/jobs",
        title: "Browse Applicants",
        description: "Review AI-scored candidates with archetype and skills data.",
        icon: Users,
        color: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-900/20",
    },
    {
        href: "/employer/onboarding",
        title: "Company Profile",
        description: "Set up your employer brand, logo, location, and industry.",
        icon: Building2,
        color: "text-indigo-500",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
        href: "/dashboard/analytics",
        title: "Hiring Analytics",
        description: "Track applicant flow, score distributions, and conversion rates.",
        icon: BarChart3,
        color: "text-teal-500",
        bg: "bg-teal-50 dark:bg-teal-900/20",
    },
];

const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    rejected: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    hired: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

const ARCHETYPE_COLORS: Record<string, string> = {
    default: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

export default async function TalentScoutDashboardPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    let stats: Awaited<ReturnType<typeof getEmployerDashboardStats>> = {
        activeJobs: 0,
        totalApplicants: 0,
        newThisWeek: 0,
        company: null,
        recentApplicants: [],
    };

    let topMatches: Awaited<ReturnType<typeof getTopCandidateMatches>> = [];

    try {
        stats = await getEmployerDashboardStats();
        topMatches = await getTopCandidateMatches();
    } catch {
        // No company yet or DB error — show empty state
    }


    const statCards = [
        {
            label: "Active Jobs",
            value: stats.activeJobs,
            icon: Briefcase,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            sub: "published listings",
        },
        {
            label: "Total Applicants",
            value: stats.totalApplicants,
            icon: Users,
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-900/20",
            sub: "across all jobs",
        },
        {
            label: "New This Week",
            value: stats.newThisWeek,
            icon: TrendingUp,
            color: "text-rose-500",
            bg: "bg-rose-50 dark:bg-rose-900/20",
            sub: "recent applications",
        },
        {
            label: "Company",
            value: stats.company?.name ? stats.company.name.split(" ")[0] ?? "—" : "—",
            icon: Building2,
            color: "text-indigo-500",
            bg: "bg-indigo-50 dark:bg-indigo-900/20",
            sub: stats.company?.industry ?? "Set up profile",
        },
    ];

    return (
        <div className="p-6 md:p-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-3">
                        🎯 Talent Scout Dashboard
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Welcome back{user.firstName ? `, ${user.firstName}` : ""}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Your hiring pipeline at a glance.
                    </p>
                </div>

                {/* No company prompt */}
                {!stats.company && (
                    <div className="mb-8 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-6 dark:border-amber-800 dark:bg-amber-900/10">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                                <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white">Set up your company profile</p>
                                <p className="text-sm text-muted-foreground">Create a company profile to start posting jobs and viewing applicants.</p>
                            </div>
                            <Link
                                href="/employer/onboarding"
                                className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                            >
                                Get Started →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats grid */}
                <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {statCards.map((s) => (
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

                {/* Recent applicants */}
                {stats.recentApplicants.length > 0 && (
                    <div className="mb-8">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Recent Applicants</h2>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Applicant</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Archetype</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Score</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500">Applied</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {stats.recentApplicants.map((a) => (
                                        <tr key={a.applicationId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {a.applicantName[0]}
                                                    </div>
                                                    <span className="font-medium text-slate-900 dark:text-white">{a.applicantName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.jobTitle}</td>
                                            <td className="px-4 py-3">
                                                {a.archetypeName ? (
                                                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                                        {a.archetypeName}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {a.avgInterviewScore != null ? (
                                                    <span className="font-semibold text-slate-900 dark:text-white">{a.avgInterviewScore}%</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">No interviews</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-600"}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs">
                                                {a.appliedAt.toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Top Matches */}
                {topMatches.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top Candidate Matches</h2>
                            <Link href="/employer/discover" className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                                View recommendations →
                            </Link>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {topMatches.map((m) => (
                                <Card key={m.id} className="overflow-hidden border-slate-200 dark:border-slate-700 hover:shadow-sm transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-500 overflow-hidden shrink-0">
                                                {m.avatarUrl ? (
                                                    <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    m.name[0]
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{m.name}</h3>
                                                    {m.avgInterviewScore != null && (
                                                        <span className="shrink-0 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                                                            ★ {m.avgInterviewScore}%
                                                        </span>
                                                    )}
                                                </div>

                                                {m.archetypeName && (
                                                    <div className="mt-1">
                                                        <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                                            {m.archetypeName}
                                                        </span>
                                                    </div>
                                                )}

                                                {m.skills.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-1">
                                                        {m.skills.map((s) => (
                                                            <span key={s} className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-500 border border-slate-100 dark:border-slate-700">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <button className="mt-4 w-full text-xs font-semibold py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    Invite to Apply
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}


                {/* Feature nav */}
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Your Tools</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((f) => (
                        <Link key={f.title} href={f.href}>
                            <Card className={`h-full transition-all hover:-translate-y-0.5 hover:shadow-md ${f.highlight ? "border-amber-300 dark:border-amber-700" : ""} hover:bg-accent/30`}>
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
