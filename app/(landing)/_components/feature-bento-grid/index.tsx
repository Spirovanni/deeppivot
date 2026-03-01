import { cn } from "@/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconMicrophone,
  IconBrain,
  IconTarget,
  IconChartLine,
  IconUsers,
  IconSchool,
  IconRocket,
  IconHeart,
  IconFileDescription,
  IconFileText,
  IconLetterCase,
  IconChartRadar,
} from "@tabler/icons-react";

export function FeatureBentoGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          icon={item.icon}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          )}
        />
      ))}
    </div>
  );
}

const VoiceWaveform = () => {
  // Use fixed heights that are consistent between server and client
  const heights = [15, 28, 22, 35, 18, 32, 25, 38, 20, 30, 16, 33];

  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 to-blue-50 items-center justify-center p-4">
      <div className="flex items-end space-x-1">
        {heights.map((height, i) => (
          <div
            key={i}
            className="bg-blue-500 rounded-full animate-pulse"
            style={{
              width: '4px',
              height: `${height}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const EmotionChart = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 to-purple-50 items-center justify-center p-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-700"></div>
      <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      <div className="absolute inset-2 rounded-full bg-purple-500 flex items-center justify-center">
        <IconHeart className="h-6 w-6 text-white animate-pulse" />
      </div>
    </div>
  </div>
);

const CareerPath = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-green-100 dark:from-green-900/20 dark:to-green-800/20 to-green-50 items-center justify-center p-4">
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <div className="w-8 h-0.5 bg-green-300"></div>
      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
      <div className="w-8 h-0.5 bg-green-300"></div>
      <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
    </div>
  </div>
);

const AnalyticsGraph = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 to-orange-50 items-center justify-center p-4">
    <div className="flex items-end space-x-1 h-12">
      {[20, 35, 25, 45, 30, 50, 40].map((height, i) => (
        <div
          key={i}
          className="bg-orange-500 rounded-t"
          style={{
            width: '8px',
            height: `${height}%`,
          }}
        />
      ))}
    </div>
  </div>
);

const NetworkNodes = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 to-indigo-50 items-center justify-center p-4">
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-4 w-2 h-2 bg-indigo-500 rounded-full"></div>
      <div className="absolute top-8 right-6 w-2 h-2 bg-indigo-400 rounded-full"></div>
      <div className="absolute bottom-4 left-6 w-2 h-2 bg-indigo-600 rounded-full"></div>
      <div className="absolute bottom-2 right-4 w-2 h-2 bg-indigo-500 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-700 rounded-full animate-pulse"></div>
    </div>
  </div>
);

const EducationStack = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 to-teal-50 items-center justify-center p-4">
    <div className="flex flex-col space-y-1">
      <div className="w-12 h-2 bg-teal-500 rounded"></div>
      <div className="w-10 h-2 bg-teal-400 rounded"></div>
      <div className="w-14 h-2 bg-teal-600 rounded"></div>
      <div className="w-8 h-2 bg-teal-300 rounded"></div>
    </div>
  </div>
);

const RocketLaunch = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-red-100 dark:from-red-900/20 dark:to-red-800/20 to-red-50 items-center justify-center p-4">
    <div className="relative">
      <IconRocket className="h-8 w-8 text-red-500 animate-bounce" />
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-gradient-to-t from-red-400 to-transparent rounded"></div>
    </div>
  </div>
);

const ContextAwareVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 to-cyan-50 items-center justify-center p-4">
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-1">
        <div className="h-2 w-10 rounded bg-cyan-400"></div>
        <div className="h-2 w-14 rounded bg-cyan-300"></div>
        <div className="h-2 w-8 rounded bg-cyan-500"></div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-white">
        <IconTarget className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-2 w-8 rounded bg-cyan-400 animate-pulse"></div>
        <div className="h-2 w-12 rounded bg-cyan-300 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
        <div className="h-2 w-6 rounded bg-cyan-500 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
      </div>
    </div>
  </div>
);

const ResumeVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 to-amber-50 items-center justify-center p-4">
    <div className="relative w-16 h-20 rounded-md border-2 border-amber-300 bg-white dark:bg-slate-800 dark:border-amber-600 p-1.5">
      <div className="h-1.5 w-8 rounded bg-amber-400 mb-1"></div>
      <div className="h-1 w-10 rounded bg-amber-200 mb-0.5"></div>
      <div className="h-1 w-7 rounded bg-amber-200 mb-0.5"></div>
      <div className="h-1 w-9 rounded bg-amber-200 mb-1.5"></div>
      <div className="h-1.5 w-6 rounded bg-amber-400 mb-0.5"></div>
      <div className="h-1 w-10 rounded bg-amber-200 mb-0.5"></div>
      <div className="h-1 w-8 rounded bg-amber-200"></div>
      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
        <IconBrain className="h-2.5 w-2.5 text-white" />
      </div>
    </div>
  </div>
);

const CoverLetterVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 to-rose-50 items-center justify-center p-4">
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="h-1.5 w-12 rounded bg-rose-300"></div>
        <div className="h-1 w-10 rounded bg-rose-200"></div>
        <div className="h-1 w-14 rounded bg-rose-200"></div>
        <div className="h-1 w-8 rounded bg-rose-200"></div>
      </div>
      <div className="text-rose-400 text-lg font-bold">→</div>
      <div className="flex flex-col gap-0.5">
        <div className="h-1.5 w-12 rounded bg-rose-500 animate-pulse"></div>
        <div className="h-1 w-10 rounded bg-rose-400 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
        <div className="h-1 w-14 rounded bg-rose-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
        <div className="h-1 w-8 rounded bg-rose-400 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
      </div>
    </div>
  </div>
);

const MatchScoreVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 to-emerald-50 items-center justify-center p-4">
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-emerald-200 dark:stroke-emerald-800" />
        <circle
          cx="18" cy="18" r="15" fill="none" strokeWidth="3"
          strokeDasharray="70 30"
          strokeLinecap="round"
          className="stroke-emerald-500 animate-pulse"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">87%</span>
      </div>
    </div>
  </div>
);

const items = [
  {
    title: "AI Voice Interviews",
    description: "Practice with realistic voice interviews powered by ElevenLabs Conversational AI. Get real-time feedback and integrate interview sessions into FlowArcs workflows for automated career development.",
    header: <VoiceWaveform />,
    icon: <IconMicrophone className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Interview Feedback & Analysis",
    description: "Receive constructive feedback on interview performance. Track progress across sessions and identify areas for improvement.",
    header: <EmotionChart />,
    icon: <IconHeart className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Context-Aware Interview Prep",
    description: "Upload a job description and get interview questions tailored specifically to that role, company, and required skills — including behavioral and technical questions.",
    header: <ContextAwareVisual />,
    icon: <IconFileDescription className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Career Archetype Assessment",
    description: "Discover your unique career persona through AI-powered 18-question assessment with 6 distinct archetypes and behavioral trait modeling.",
    header: <CareerPath />,
    icon: <IconTarget className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Dynamic Career Planning",
    description:
      "Build interactive career roadmaps with draggable timelines, milestones, and curated resource recommendations. Export to FlowArcs for workflow automation.",
    header: <AnalyticsGraph />,
    icon: <IconChartLine className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Resume Intelligence",
    description: "Upload your resume for AI parsing. Your skills, experience, and strengths are extracted to personalize interview coaching and match against job descriptions.",
    header: <ResumeVisual />,
    icon: <IconFileText className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Performance Analytics Dashboard",
    description: "Track your progress with detailed analytics on interview performance, skills development, emotional growth, and session history over time.",
    header: <AnalyticsGraph />,
    icon: <IconBrain className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "AI Cover Letters",
    description: "Generate targeted cover letters matched to specific job descriptions, highlighting your relevant experience and aligning your skills with role requirements.",
    header: <CoverLetterVisual />,
    icon: <IconLetterCase className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Mentor & Coach Network",
    description: "Connect with industry mentors, career coaches, and workforce development partners for personalized guidance and professional connections.",
    header: <NetworkNodes />,
    icon: <IconUsers className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Education Explorer",
    description: "Discover 500+ bootcamps, certifications, and funding opportunities with ROI analysis, eligibility matching, and application tracking.",
    header: <EducationStack />,
    icon: <IconSchool className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Job Match Scoring",
    description: "See exactly how your profile matches against job requirements with visual skill coverage analysis, gap identification, and improvement recommendations.",
    header: <MatchScoreVisual />,
    icon: <IconChartRadar className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Job Marketplace & Tracker",
    description: "Discover and apply to exclusive roles directly within DeepPivot, and track all your applications with a drag-and-drop Kanban board.",
    header: <RocketLaunch />,
    icon: <IconRocket className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Employer Insights",
    description: "For hiring managers: tap into an AI-verified talent pool. Review behavioral insights, technical scores, and archetype fit before you interview.",
    header: <AnalyticsGraph />,
    icon: <IconUsers className="h-4 w-4 text-neutral-500" />,
  },
];
