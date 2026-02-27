"use client";

import { useState, useTransition } from "react";
import { setUserTrack, type TrackChoice } from "@/src/lib/actions/onboarding";

interface TrackCard {
    id: TrackChoice;
    emoji: string;
    name: string;
    tagline: string;
    description: string;
    features: string[];
    gradient: string;
    accentColor: string;
    borderColor: string;
    glowColor: string;
    iconBg: string;
}

const TRACKS: TrackCard[] = [
    {
        id: "trailblazer",
        emoji: "🚀",
        name: "Trailblazer",
        tagline: "I'm growing my career",
        description:
            "Practice AI voice interviews, discover your career archetype, build your roadmap, and land your next role with confidence.",
        features: [
            "AI voice interview coaching",
            "Career archetype analysis",
            "Personalized career roadmap",
            "Job application tracker",
            "Mentor network access",
        ],
        gradient: "from-violet-600 via-purple-600 to-indigo-700",
        accentColor: "text-violet-400",
        borderColor: "border-violet-500/40 hover:border-violet-400/80",
        glowColor: "hover:shadow-violet-500/25",
        iconBg: "bg-violet-500/20",
    },
    {
        id: "talent-scout",
        emoji: "🎯",
        name: "Talent Scout",
        tagline: "I'm discovering talent",
        description:
            "Post jobs, review AI-scored applicants, get new applicant alerts, and build your team with data-driven hiring insights.",
        features: [
            "Job posting & management",
            "AI-scored applicant profiles",
            "Career archetype matching",
            "Applicant pipeline tracking",
            "New applicant email alerts",
        ],
        gradient: "from-pink-600 via-rose-600 to-orange-600",
        accentColor: "text-pink-400",
        borderColor: "border-pink-500/40 hover:border-pink-400/80",
        glowColor: "hover:shadow-pink-500/25",
        iconBg: "bg-pink-500/20",
    },
];

interface Props {
    displayName: string;
}

export default function OnboardingClient({ displayName }: Props) {
    const [selected, setSelected] = useState<TrackChoice | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSelect = (track: TrackChoice) => {
        setSelected(track);
    };

    const handleConfirm = () => {
        if (!selected) return;
        startTransition(async () => {
            await setUserTrack(selected);
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
            {/* Animated background orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute -top-40 left-1/4 size-96 rounded-full bg-violet-600/20 blur-3xl"
                    style={{ animation: "pulse 4s ease-in-out infinite" }}
                />
                <div
                    className="absolute -bottom-40 right-1/4 size-96 rounded-full bg-pink-600/20 blur-3xl"
                    style={{ animation: "pulse 4s ease-in-out infinite 2s" }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05),transparent_70%)]" />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative z-10 w-full max-w-4xl">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="mb-3 flex items-center justify-center gap-2">
                        <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
                        <span className="text-lg font-semibold text-white/70">DeepPivot</span>
                    </div>
                    <h1 className="mb-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        Welcome, {displayName}! 👋
                    </h1>
                    <p className="mx-auto max-w-xl text-lg text-slate-400">
                        Tell us how you&apos;ll use DeepPivot — we&apos;ll personalize your experience
                        based on your path.
                    </p>
                </div>

                {/* Track Cards */}
                <div className="mb-8 grid gap-5 sm:grid-cols-2">
                    {TRACKS.map((track) => {
                        const isSelected = selected === track.id;

                        return (
                            <button
                                key={track.id}
                                id={`track-${track.id}`}
                                onClick={() => handleSelect(track.id)}
                                disabled={isPending}
                                className={[
                                    "group relative flex flex-col rounded-2xl border-2 bg-slate-900/80 p-7 text-left backdrop-blur-sm",
                                    "shadow-xl transition-all duration-300",
                                    track.borderColor,
                                    track.glowColor,
                                    isSelected
                                        ? "scale-[1.02] shadow-2xl ring-2 ring-offset-2 ring-offset-slate-950"
                                        : "hover:scale-[1.01] hover:shadow-2xl",
                                    isSelected && track.id === "trailblazer"
                                        ? "ring-violet-500"
                                        : isSelected && track.id === "talent-scout"
                                            ? "ring-pink-500"
                                            : "",
                                ].join(" ")}
                            >
                                {/* Selection indicator */}
                                {isSelected && (
                                    <div className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-white">
                                        <svg
                                            className="size-4 text-slate-900"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}

                                {/* Gradient overlay when selected */}
                                {isSelected && (
                                    <div
                                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${track.gradient} opacity-5`}
                                    />
                                )}

                                {/* Icon */}
                                <div
                                    className={`mb-5 flex size-16 items-center justify-center rounded-2xl text-4xl ${track.iconBg}`}
                                >
                                    {track.emoji}
                                </div>

                                {/* Name & tagline */}
                                <div className="mb-3">
                                    <h2 className="mb-1 text-2xl font-bold text-white">{track.name}</h2>
                                    <p className={`text-sm font-semibold uppercase tracking-widest ${track.accentColor}`}>
                                        {track.tagline}
                                    </p>
                                </div>

                                {/* Description */}
                                <p className="mb-5 text-sm leading-relaxed text-slate-400">
                                    {track.description}
                                </p>

                                {/* Feature list */}
                                <ul className="space-y-2">
                                    {track.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                                            <span className={`size-1.5 rounded-full bg-gradient-to-r ${track.gradient} flex-shrink-0`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        );
                    })}
                </div>

                {/* Confirm Button */}
                <div className="flex flex-col items-center gap-3">
                    <button
                        id="confirm-track"
                        onClick={handleConfirm}
                        disabled={!selected || isPending}
                        className={[
                            "relative h-14 w-full max-w-sm overflow-hidden rounded-xl text-base font-semibold text-white shadow-lg transition-all duration-300",
                            selected && !isPending
                                ? selected === "trailblazer"
                                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                                    : "bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 hover:shadow-pink-500/40 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                                : "cursor-not-allowed bg-slate-800 text-slate-500",
                        ].join(" ")}
                    >
                        {isPending ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="size-5 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <circle cx="12" cy="12" r="10" className="opacity-25" />
                                    <path d="M4 12a8 8 0 018-8" className="opacity-75" />
                                </svg>
                                Setting up your dashboard…
                            </span>
                        ) : selected ? (
                            <span>
                                Launch as{" "}
                                <span className="font-black">
                                    {TRACKS.find((t) => t.id === selected)?.name}
                                </span>{" "}
                                →
                            </span>
                        ) : (
                            "Choose a path above"
                        )}
                    </button>

                    <p className="text-xs text-slate-600">
                        You can always switch paths later from your profile settings.
                    </p>
                </div>
            </div>
        </div>
    );
}
