import Link from "next/link";
import { Trophy, Flame, Activity, Sparkles, Users } from "lucide-react";
import { getAdminGamificationMetrics } from "@/src/lib/actions/admin-gamification";

export default async function AdminGamificationPage() {
  const metrics = await getAdminGamificationMetrics();

  const cards = [
    {
      label: "Gamification Enabled",
      value: metrics.enabledUsers,
      icon: Trophy,
      color: "text-amber-500",
      sub: `${metrics.disabledUsers} disabled`,
    },
    {
      label: "Active Users (7d)",
      value: metrics.usersWithActivity7d,
      icon: Users,
      color: "text-blue-500",
      sub: `${metrics.events7d} events`,
    },
    {
      label: "Points Awarded (7d)",
      value: metrics.pointsAwarded7d,
      icon: Sparkles,
      color: "text-violet-500",
      sub: `avg ${metrics.averagePointsPerUser} pts/user`,
    },
    {
      label: "Users With Streak",
      value: metrics.usersWithStreak,
      icon: Flame,
      color: "text-orange-500",
      sub: "current streak > 0",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gamification Engagement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin reporting for points, streaks, and feature adoption.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{card.label}</span>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
            <div className={`mt-2 text-3xl font-bold ${card.color}`}>
              {card.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Top Gamification Events</h2>
          </div>
          {metrics.topEventTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gamification events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.topEventTypes.map((event) => (
                <div key={event.eventType} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {event.eventType
                      .split("_")
                      .map((token) => token.charAt(0) + token.slice(1).toLowerCase())
                      .join(" ")}
                  </span>
                  <span className="font-semibold">{event.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Top Users By Points</h2>
          </div>
          {metrics.topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user gamification records yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.topUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between rounded-lg border bg-background/70 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      #{index + 1} {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Streak {user.currentStreak} (best {user.highestStreak})
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {user.points.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

