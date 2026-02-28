"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mic2, Code2, Users, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { InterviewSettingsModal } from "./InterviewSettingsModal";

const SESSION_TYPES = [
  {
    type: "behavioral",
    label: "Behavioral",
    description: "Practice answering questions about past experiences. Perfect for mastering the STAR method.",
    icon: Users,
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    type: "technical",
    label: "Technical",
    description: "Solve problems and explain technical concepts. Great for engineering roles.",
    icon: Code2,
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    type: "situational",
    label: "Situational",
    description: "Navigate hypothetical workplace scenarios. Build your decision-making skills.",
    icon: Lightbulb,
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    type: "general",
    label: "General",
    description: "Comprehensive interview practice covering all types. Best for overall preparation.",
    icon: Mic2,
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
];

export interface StartInterviewCTAProps {
  jobDescriptions: { id: number; positionTitle: string | null; companyName: string | null }[];
  resumes: { id: number; title: string | null }[];
}

export function StartInterviewCTA({ jobDescriptions, resumes }: StartInterviewCTAProps) {
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultSessionType, setDefaultSessionType] = useState("general");
  const [defaultJobQuery, setDefaultJobQuery] = useState("");

  useEffect(() => {
    // If we came from a "Practice for this Job" button
    if (searchParams.get("practice") === "true") {
      const company = searchParams.get("company") || "";
      const position = searchParams.get("position") || "";
      setDefaultJobQuery(`${company} ${position}`.trim());
      setDefaultSessionType("general");
      setModalOpen(true);
    }
  }, [searchParams]);

  const handleCardClick = (type: string) => {
    setDefaultSessionType(type);
    setDefaultJobQuery("");
    setModalOpen(true);
  };

  return (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choose Your Interview Type</h2>
          <span className="text-xs text-muted-foreground">~10-15 minutes</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SESSION_TYPES.map(({ type, label, description, icon: Icon, gradient }) => (
            <button
              key={type}
              onClick={() => handleCardClick(type)}
              aria-label={`Start ${label} interview — ${description}`}
              className="group rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full cursor-pointer border-2 transition-all hover:border-primary/50 hover:shadow-lg active:scale-[0.98]">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} transition-transform group-hover:scale-110`} aria-hidden="true">
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          💬 Click any interview type to customize your context and start a voice conversation
        </p>
      </div>

      <InterviewSettingsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        jobDescriptions={jobDescriptions}
        resumes={resumes}
        defaultSessionType={defaultSessionType}
        defaultJobQuery={defaultJobQuery}
      />
    </>
  );
}
