import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, BookOpen, MapPin, Target, ArrowRight } from "lucide-react";
import type { PredictiveInsight } from "@/src/lib/predictive-career-analytics";

interface PredictiveInsightsWidgetProps {
  insights: PredictiveInsight[];
}

const TYPE_CONFIG = {
  skill: {
    icon: BookOpen,
    label: "Skill",
    href: "/dashboard/interviews",
  },
  career_path: {
    icon: MapPin,
    label: "Career Path",
    href: "/dashboard/archetype",
  },
  goal: {
    icon: Target,
    label: "Goal",
    href: "/dashboard/career-plan",
  },
} as const;

export function PredictiveInsightsWidget({ insights }: PredictiveInsightsWidgetProps) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">AI Career Insights</CardTitle>
            <CardDescription>
              Recommended next steps based on your archetype, skills, and goals
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => {
          const config = TYPE_CONFIG[insight.type];
          const Icon = config.icon;
          return (
            <Link key={i} href={config.href}>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/30">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {config.label}
                  </p>
                  <p className="mt-0.5 font-medium">{insight.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
