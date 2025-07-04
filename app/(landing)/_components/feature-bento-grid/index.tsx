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
  IconVideo,
} from "@tabler/icons-react";

export function FeatureBentoGrid() {
  return (
    <BentoGrid className="max-w-4xl mx-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          icon={item.icon}
          className={i === 3 || i === 6 ? "md:col-span-2" : ""}
        />
      ))}
    </BentoGrid>
  );
}

const VoiceWaveform = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 to-blue-50 items-center justify-center p-4">
    <div className="flex items-end space-x-1">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="bg-blue-500 rounded-full animate-pulse"
          style={{
            width: '4px',
            height: `${Math.random() * 30 + 10}px`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  </div>
);

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

const items = [
  {
    title: "AI Voice Interviews",
    description: "Practice with realistic voice and video interviews powered by advanced AI with <800ms latency.",
    header: <VoiceWaveform />,
    icon: <IconMicrophone className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Emotional Intelligence",
    description: "Get feedback on your emotional responses and communication style using Hume AI emotion detection.",
    header: <EmotionChart />,
    icon: <IconHeart className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Career Archetyping",
    description: "Discover your unique career persona through AI-powered behavioral trait modeling and NLP analysis.",
    header: <CareerPath />,
    icon: <IconTarget className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Personalized Career Planning",
    description:
      "Build dynamic career roadmaps with draggable timelines, milestones, and curated resource recommendations.",
    header: <AnalyticsGraph />,
    icon: <IconChartLine className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Real-time Performance Analytics",
    description: "Track your progress with detailed analytics on interview performance, skills development, and emotional growth.",
    header: <AnalyticsGraph />,
    icon: <IconBrain className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Mentor & Coach Network",
    description: "Connect with industry mentors and workforce development partners for personalized guidance.",
    header: <NetworkNodes />,
    icon: <IconUsers className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Alternative Education Explorer",
    description: "Discover 500+ bootcamps, certifications, and funding opportunities with ROI analysis and eligibility matching.",
    header: <EducationStack />,
    icon: <IconSchool className="h-4 w-4 text-neutral-500" />,
  },
];
