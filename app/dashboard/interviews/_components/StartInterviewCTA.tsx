"use client";

import { useRouter } from "next/navigation";
import { Mic2, Code2, Users, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SESSION_TYPES = [
  {
    type: "behavioral",
    label: "Behavioral",
    description: "Discuss past experiences using the STAR method.",
    icon: Users,
  },
  {
    type: "technical",
    label: "Technical",
    description: "Problem-solving, system design, and coding concepts.",
    icon: Code2,
  },
  {
    type: "situational",
    label: "Situational",
    description: "How you'd handle hypothetical scenarios on the job.",
    icon: Lightbulb,
  },
  {
    type: "general",
    label: "General",
    description: "Open-ended practice across all interview dimensions.",
    icon: Mic2,
  },
];

export function StartInterviewCTA() {
  const router = useRouter();

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Start New Interview</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SESSION_TYPES.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            onClick={() => router.push(`/dashboard/interviews/session?type=${type}`)}
            className="text-left"
          >
            <Card className="h-full cursor-pointer transition-all hover:bg-accent/50 hover:shadow-md active:scale-[0.98]">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
