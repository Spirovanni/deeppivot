"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Overview",
  interviews: "Interviews",
  analytics: "Analytics",
  archetype: "Career Archetype",
  "career-plan": "Career Plan",
  mentors: "Mentors",
  education: "Education Explorer",
  "job-tracker": "Job Tracker",
  feedback: "Feedback",
  session: "Session",
};

function getLabel(segment: string, index: number, segments: string[]): string {
  if (segment in SEGMENT_LABELS) return SEGMENT_LABELS[segment];
  if (segment === "[sessionId]" || /^\d+$/.test(segment)) {
    const prev = segments[index - 1];
    return prev === "interviews" ? "Session" : segment;
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname() ?? "/dashboard";
  const segments = pathname.split("/").filter(Boolean).slice(1); // Skip "dashboard"

  const isRoot = pathname === "/dashboard" || pathname === "/dashboard/";

  return (
    <Breadcrumb className="px-4 py-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          {isRoot ? (
            <BreadcrumbPage>Overview</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Overview</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1;
          const href = "/dashboard/" + segments.slice(0, i + 1).join("/");
          const label = getLabel(segment, i, segments);

          return (
            <span key={href} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
