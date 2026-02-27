"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Rocket, Target, ChevronRight, Mic, Brain, Map, BookOpen, Users, Briefcase, Building2, BarChart3, Zap, Star } from "lucide-react";

const PATHS = [
    {
        id: "trailblazer",
        emoji: "🚀",
        icon: Rocket,
        name: "Trailblazer",
        audience: "For Job Seekers",
        tagline: "Chart your course. Own your career arc.",
        description: "Practice AI voice interviews, discover your career archetype, track applications, and connect with mentors — all in one place.",
        perks: [
            { icon: Mic, text: "AI voice interview coaching with real-time feedback" },
            { icon: Brain, text: "Discover your unique career archetype" },
            { icon: Map, text: "Personalized career roadmap & job tracker" },
        ],
        href: "/trailblazer",
        gradient: "from-violet-600 via-purple-600 to-pink-600",
        glowColor: "rgba(139, 92, 246, 0.25)",
        borderHover: "hover:border-violet-400/60",
        badgeBg: "bg-violet-100 dark:bg-violet-900/40",
        badgeText: "text-violet-700 dark:text-violet-300",
        ctaBg: "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700",
        iconBg: "bg-violet-100 dark:bg-violet-900/40",
        iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
        id: "talent-scout",
        emoji: "🎯",
        icon: Target,
        name: "Talent Scout",
        audience: "For Employers",
        tagline: "Find the signal in the noise. Hire with confidence.",
        description: "Post jobs directly into candidates' workflows, review AI-assessed interview scores, and hire from a pipeline of motivated talent.",
        perks: [
            { icon: BarChart3, text: "AI-assessed interview scores & archetype insights" },
            { icon: Zap, text: "Zero friction — post directly into candidate job trackers" },
            { icon: Building2, text: "Hire from a curated pool of motivated, vetted talent" },
        ],
        href: "/talent-scout",
        gradient: "from-amber-500 via-orange-500 to-rose-500",
        glowColor: "rgba(245, 158, 11, 0.25)",
        borderHover: "hover:border-amber-400/60",
        badgeBg: "bg-amber-100 dark:bg-amber-900/40",
        badgeText: "text-amber-700 dark:text-amber-300",
        ctaBg: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        iconColor: "text-amber-600 dark:text-amber-400",
    },
];

export function PathChooser() {
    const router = useRouter();

    return (
        <section className="relative w-full overflow-hidden bg-white py-24 dark:bg-slate-900">
            {/* Subtle dot grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#8080800a_1px,transparent_1px)] bg-[size:2rem_2rem]" />

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="mb-16 text-center"
                >
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Star className="h-4 w-4 text-amber-500" />
                        Choose your path
                    </div>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                        Who are you here as?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500 dark:text-slate-400">
                        DeepPivot works for both sides of the hiring equation. Pick your track to see what's built for you.
                    </p>
                </motion.div>

                {/* Path cards */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                    {PATHS.map((path, i) => (
                        <motion.div
                            key={path.id}
                            initial={{ opacity: 0, y: 32 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55, delay: i * 0.1 }}
                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                            onClick={() => router.push(path.href)}
                            className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg ring-1 ring-transparent transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 ${path.borderHover} hover:ring-1 hover:shadow-2xl`}
                            style={
                                { "--glow": path.glowColor } as React.CSSProperties
                            }
                        >
                            {/* Background glow on hover */}
                            <div
                                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                style={{
                                    background: `radial-gradient(600px circle at 50% -50%, ${path.glowColor}, transparent 70%)`,
                                }}
                            />

                            {/* Gradient accent line at top */}
                            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${path.gradient}`} />

                            <div className="relative space-y-6">
                                {/* Header row */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${path.iconBg} text-3xl shadow-sm`}>
                                            {path.emoji}
                                        </div>
                                        <div>
                                            <div className={`mb-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${path.badgeBg} ${path.badgeText}`}>
                                                {path.audience}
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {path.name}
                                            </h3>
                                        </div>
                                    </div>
                                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                                </div>

                                {/* Tagline */}
                                <p className={`text-base font-semibold bg-gradient-to-r ${path.gradient} bg-clip-text text-transparent`}>
                                    {path.tagline}
                                </p>

                                {/* Description */}
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    {path.description}
                                </p>

                                {/* Perks */}
                                <ul className="space-y-3">
                                    {path.perks.map(({ icon: Icon, text }) => (
                                        <li key={text} className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${path.iconBg}`}>
                                                <Icon className={`h-3.5 w-3.5 ${path.iconColor}`} />
                                            </div>
                                            <span className="text-sm text-slate-600 dark:text-slate-300">{text}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <button
                                    className={`w-full rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] ${path.ctaBg}`}
                                    onClick={(e) => { e.stopPropagation(); router.push(path.href); }}
                                >
                                    Explore {path.name} →
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="mt-10 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                    Not sure? You can always switch tracks after signing up.
                </motion.p>
            </div>
        </section>
    );
}
