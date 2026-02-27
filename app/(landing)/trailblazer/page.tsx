"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { SignUpButton, useUser } from "@clerk/nextjs";
import {
    Mic, Brain, Map, BookOpen, Users, Briefcase,
    ChevronRight, Sparkles, Star, CheckCircle2, ArrowLeft,
    Zap, TrendingUp, Target
} from "lucide-react";

const FEATURES = [
    {
        icon: Mic,
        title: "AI Voice Interview Coach",
        description: "Practice with a realistic AI interviewer. Get scored on clarity, confidence, and content — in real time.",
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
        icon: Brain,
        title: "Career Archetype Discovery",
        description: "Find out which of 6 career archetypes you are. Understand your strengths, blind spots, and how you show up in the room.",
        color: "text-pink-500",
        bg: "bg-pink-50 dark:bg-pink-900/20",
    },
    {
        icon: Map,
        title: "Smart Job Tracker",
        description: "Track every application in a visual kanban board. Jobs from our marketplace flow in automatically.",
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
        icon: BookOpen,
        title: "Education Explorer",
        description: "Browse 500+ bootcamps, certifications, and degree programs matched to your career arc and budget.",
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
        icon: Users,
        title: "Mentor Network",
        description: "Connect with vetted mentors in your target industry. Get real guidance from people who've made the pivot.",
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
        icon: Briefcase,
        title: "Job Marketplace",
        description: "Apply directly to roles posted by employers inside DeepPivot — companies actively looking for career-pivoters.",
        color: "text-indigo-500",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
];

const STEPS = [
    {
        number: "01",
        title: "Practice & Get Scored",
        description: "Run AI voice mock interviews. Get instant feedback on every answer with emotion and confidence analysis.",
        color: "from-violet-600 to-purple-600",
    },
    {
        number: "02",
        title: "Discover Your Archetype",
        description: "After your sessions, AI identifies your career archetype — your unique professional fingerprint.",
        color: "from-purple-600 to-pink-600",
    },
    {
        number: "03",
        title: "Get Hired",
        description: "Employers see your interview performance and archetype. Land roles that actually fit who you are.",
        color: "from-pink-600 to-rose-600",
    },
];

const STATS = [
    { value: "500+", label: "Education Programs" },
    { value: "6", label: "Career Archetypes" },
    { value: "100+", label: "Employers Hiring" },
    { value: "<800ms", label: "Interview Latency" },
];

export default function TrailblazerPage() {
    const router = useRouter();
    const { isSignedIn } = useUser();

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 pt-16 pb-24">
                {/* Background blobs */}
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" />
                <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-pink-200/40 blur-3xl dark:bg-pink-500/10" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

                <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
                    {/* Back link */}
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        onClick={() => router.push("/")}
                        className="mb-10 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to home
                    </motion.button>

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-sm dark:border-violet-800 dark:bg-slate-900/80 dark:text-violet-300"
                    >
                        <span className="text-lg">🚀</span>
                        Trailblazer Track
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1 }}
                        className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl"
                    >
                        Your Career,
                        <span className="block bg-gradient-to-r from-violet-600 via-pink-600 to-violet-600 bg-clip-text text-transparent">
                            Unlocked.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.2 }}
                        className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-slate-600 dark:text-slate-300"
                    >
                        Practice interviews with AI, discover your career archetype, and connect directly with employers looking for someone exactly like you.
                    </motion.p>

                    {/* Pill features */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.3 }}
                        className="mt-8 flex flex-wrap items-center justify-center gap-3"
                    >
                        {["AI Voice Interviews", "Career Archetypes", "Job Tracker", "Mentor Network"].map((p) => (
                            <div
                                key={p}
                                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                                {p}
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.4 }}
                        className="mt-10 flex flex-wrap items-center justify-center gap-4"
                    >
                        {isSignedIn ? (
                            <button
                                onClick={() => router.push("/dashboard/trailblazer")}
                                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-violet-700 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100" />
                                <span className="relative flex items-center gap-2">
                                    <Zap className="h-5 w-5" /> Go to Dashboard
                                </span>
                            </button>
                        ) : (
                            <SignUpButton mode="modal">
                                <button className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                                    <span className="absolute inset-0 bg-gradient-to-r from-violet-700 to-pink-700 opacity-0 transition-opacity group-hover:opacity-100" />
                                    <span className="relative flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" /> Start for Free
                                    </span>
                                </button>
                            </SignUpButton>
                        )}
                        <button
                            onClick={() => router.push("/pricing")}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-900 shadow-sm transition-all hover:border-slate-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        >
                            View Pricing <ChevronRight className="h-5 w-5" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ── Stats bar ─────────────────────────────────────────────── */}
            <div className="border-y border-slate-200 bg-slate-50 py-8 dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                        {STATS.map((s) => (
                            <div key={s.label} className="text-center">
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">{s.value}</div>
                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Features ──────────────────────────────────────────────── */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16 text-center"
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                            Everything a Trailblazer needs
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500 dark:text-slate-400">
                            Six interconnected tools, one career operating system.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                                    <f.icon className={`h-5 w-5 ${f.color}`} />
                                </div>
                                <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ──────────────────────────────────────────── */}
            <section className="bg-slate-50 py-24 dark:bg-slate-900">
                <div className="mx-auto max-w-5xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16 text-center"
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                            How Trailblazers level up
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {STEPS.map((s, i) => (
                            <motion.div
                                key={s.number}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12 }}
                                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className={`mb-4 inline-block rounded-xl bg-gradient-to-r ${s.color} px-3 py-1 text-sm font-bold text-white`}>
                                    {s.number}
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{s.description}</p>
                                {i < STEPS.length - 1 && (
                                    <ChevronRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-slate-300 sm:block dark:text-slate-600" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 py-24">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                <div className="absolute -left-20 top-0 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

                <div className="relative mx-auto max-w-3xl px-6 text-center">
                    <h2 className="text-4xl font-bold text-white sm:text-5xl">Ready to blaze your trail?</h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                        Free to start. No resume needed. Just show up and let AI do the assessment.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        {isSignedIn ? (
                            <button
                                onClick={() => router.push("/dashboard/interviews")}
                                className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-violet-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                            >
                                Go to Dashboard →
                            </button>
                        ) : (
                            <SignUpButton mode="modal">
                                <button className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-violet-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                                    Create Free Account →
                                </button>
                            </SignUpButton>
                        )}
                        <button
                            onClick={() => router.push("/")}
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" /> Go back
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
