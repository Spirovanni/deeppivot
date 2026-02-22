"use client";

import Link from "next/link";
import { Mic2, UserCircle, MapPin, Users, GraduationCap, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

interface OnboardingBannerProps {
  hasCompletedInterviews: boolean;
  hasArchetype: boolean;
  hasCareerPlan: boolean;
}

const STEPS = [
  {
    id: "interview",
    title: "Take your first interview",
    description: "Practice with AI voice interviews and get emotion feedback.",
    href: "/dashboard/interviews",
    icon: Mic2,
  },
  {
    id: "archetype",
    title: "Discover your career archetype",
    description: "Learn your unique career persona through AI analysis.",
    href: "/dashboard/archetype",
    icon: UserCircle,
  },
  {
    id: "career-plan",
    title: "Build your career plan",
    description: "Create milestones and a roadmap for your goals.",
    href: "/dashboard/career-plan",
    icon: MapPin,
  },
  {
    id: "resources",
    title: "Explore mentors & resources",
    description: "Connect with mentors and discover education opportunities.",
    href: "/dashboard/mentors",
    icon: Users,
    secondaryHref: "/dashboard/education",
    secondaryLabel: "Education",
  },
];

export function OnboardingBanner({
  hasCompletedInterviews,
  hasArchetype,
  hasCareerPlan,
}: OnboardingBannerProps) {
  const currentStep = !hasCompletedInterviews
    ? "interview"
    : !hasArchetype
      ? "archetype"
      : !hasCareerPlan
        ? "career-plan"
        : "resources";

  const isComplete = hasCompletedInterviews && hasArchetype && hasCareerPlan;

  if (isComplete) {
    return (
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">You&apos;re all set!</p>
              <p className="text-sm text-muted-foreground">
                Explore mentors and education resources to keep growing.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/mentors">
                Mentors
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/education">
                Education
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const step = STEPS.find((s) => s.id === currentStep)!;
  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const Icon = step.icon;

  return (
    <Card className="mb-8 border-primary/30 bg-primary/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Step {stepIndex + 1} of 4
              </p>
              <p className="mt-0.5 font-semibold">{step.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild>
              <Link href={step.href}>
                {currentStep === "interview" ? "Start Interview" : "Get Started"}
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
            {step.secondaryHref && (
              <Button variant="outline" size="sm" asChild>
                <Link href={step.secondaryHref}>{step.secondaryLabel}</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Step indicators */}
        <div className="mt-4 flex gap-2">
          {STEPS.map((s, i) => {
            const isDone =
              (s.id === "interview" && hasCompletedInterviews) ||
              (s.id === "archetype" && hasArchetype) ||
              (s.id === "career-plan" && hasCareerPlan) ||
              (s.id === "resources" && isComplete);
            const isCurrent = s.id === currentStep;
            return (
              <div
                key={s.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  isDone && "bg-green-500",
                  isCurrent && !isDone && "bg-primary",
                  !isDone && !isCurrent && "bg-muted"
                )}
                title={s.title}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
