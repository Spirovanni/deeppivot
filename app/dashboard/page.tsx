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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    description:
      "Discover bootcamps, certifications, and funding opportunities.",
    icon: GraduationCap,
  },
  {
    href: "/dashboard/job-tracker",
    title: "Job Tracker",
    description: "Manage your job applications across the hiring pipeline.",
    icon: Briefcase,
  },
];

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back{user.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Choose a feature below to get started.
          </p>
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
