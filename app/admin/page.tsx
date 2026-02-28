import { requireAdmin } from "@/src/lib/admin-auth";
import { db } from "@/src/db";
import {
  usersTable,
  subscriptionsTable,
  interviewSessionsTable,
  agentConfigsTable,
} from "@/src/db/schema";
import { count, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import {
  Shield,
  Users,
  ClipboardCheck,
  Bot,
  Briefcase,
  Building2,
  Activity,
  CreditCard,
} from "lucide-react";

async function getAdminStats() {
  const [
    [totalUsersRow],
    [activeSubsRow],
    [totalInterviewsRow],
    [agentConfigsRow],
  ] = await Promise.all([
    db.select({ count: count() }).from(usersTable).where(isNull(usersTable.deletedAt)),
    db.select({ count: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "active")),
    db.select({ count: count() }).from(interviewSessionsTable).where(eq(interviewSessionsTable.status, "completed")),
    db.select({ count: count() }).from(agentConfigsTable),
  ]);

  return {
    totalUsers: totalUsersRow.count,
    activeSubscriptions: activeSubsRow.count,
    totalInterviews: totalInterviewsRow.count,
    agentConfigs: agentConfigsRow.count,
  };
}

const NAV_CARDS = [
  {
    href: "/admin/users",
    icon: Users,
    label: "User Management",
    description: "Search, edit roles, suspend or delete users.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    href: "/admin/agents",
    icon: Bot,
    label: "Agent Configs",
    description: "Create and manage AI interview agent presets.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    href: "/admin/archetype-review",
    icon: ClipboardCheck,
    label: "Archetype Review",
    description: "Approve or override AI-assigned archetypes.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    href: "/admin/jobs",
    icon: Briefcase,
    label: "Job Moderation",
    description: "Review and remove job postings.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    href: "/api/admin/export/sessions",
    icon: Activity,
    label: "Export Sessions CSV",
    description: "Download interview session analytics.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    href: "/admin/employers",
    icon: Building2,
    label: "Employer Management",
    description: "View and manage employer accounts.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    href: "/admin/blog",
    icon: ClipboardCheck,
    label: "Blog Manager",
    description: "Write and manage career blog posts.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    href: "/admin/settings",
    icon: CreditCard, // reusing icon import as placeholder
    label: "System Settings",
    description: "View environment variables securely.",
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
];

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getAdminStats();

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-green-400" },
    { label: "Interviews Completed", value: stats.totalInterviews, icon: Activity, color: "text-indigo-400" },
    { label: "Agent Configs", value: stats.agentConfigs, icon: Bot, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Platform overview and management tools.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`size-4 ${s.color}`} />
            </div>
            <div className={`text-3xl font-bold ${s.color}`}>
              {s.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Nav cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Management Areas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:bg-muted/50"
            >
              <div className={`flex size-11 items-center justify-center rounded-lg ${c.bg}`}>
                <c.icon className={`size-5 ${c.color}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">{c.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
