"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { SignUpButton, useUser } from "@clerk/nextjs";
import {
    BarChart3, Zap, Building2, Users, CheckCircle2,
    ChevronRight, ArrowLeft, Target, Star, Shield, Eye
} from "lucide-react";

const VALUES = [
    {
        icon: BarChart3,
        title: "AI-Assessed Candidates",
        description: "Every applicant comes with an interview performance score, emotion analysis, and skill mapping — before you talk to them.",
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
        icon: Target,
        title: "Archetype-Matched Hiring",
        description: "Post jobs with archetypes in mind. Our AI surfaces candidates whose career fingerprint matches your role's demands.",
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
        icon: Zap,
        title: "Zero Recruiting Friction",
        description: "Post once and your job appears natively in every candidate's job tracker. No job boards. No third-party ATS needed.",
        color: "text-yellow-500",
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
        icon: Eye,
        title: "See the Full Picture",
        description: "Go beyond the resume. Review voice interview recordings, transcripts, and communication scores side by side.",
        color: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-900/20",
    },
    {
        icon: Users,
        title: "Curated Talent Pool",
        description: "Our candidates are career-pivoters — motivated, self-directed, and actively investing in their development.",
        color: "text-indigo-500",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
        icon: Shield,
        title: "Employer Dashboard",
        description: "Manage job postings, review applications, and track hiring pipeline all from one clean employer workspace.",
        color: "text-teal-500",
        bg: "bg-teal-50 dark:bg-teal-900/20",
    },
];

const STEPS = [
    {
        number: "01",
        title: "Post Your Role",
        description: "Create a job in minutes. Set the archetype profile and skills you're looking for. No ATS integration required.",
        gradient: "from-amber-500 to-orange-500",
    },
    {
        number: "02",
        title: "Review AI Insights",
        description: "Browse candidates with interview scores, archetype badges, and confidence ratings — sorted by fit, not recency.",
        gradient: "from-orange-500 to-rose-500",
    },
    {
        number: "03",
        title: "Make the Hire",
        description: "Shortlist, message, and hire directly inside the platform. The best candidates are already warmed up.",
        gradient: "from-rose-500 to-pink-500",
    },
];

const STATS = [
    { value: "100+", label: "Active Employers" },
    { value: "6", label: "Archetype Profiles" },
    { value: "0", label: "ATS Setup Needed" },
    { value: "AI", label: "Pre-Screened Talent" },
];

// Mock candidate card data
const MOCK_CANDIDATES = [
    { archetype: "The Innovator", score: 94, comms: "Excellent", techFit: "9.5/10", status: "Available", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/40" },
    { archetype: "The Strategist", score: 88, comms: "Strong", techFit: "8.8/10", status: "Interviewing", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40" },
    { archetype: "The Connector", score: 91, comms: "Excellent", techFit: "8.2/10", status: "Available", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
];

export default function TalentScoutPage() {
    const router = useRouter();
    const { isSignedIn } = useUser();

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950 pt-16 pb-24">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
                <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
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

                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
                        {/* Left */}
                        <div className="space-y-8">
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm backdrop-blur-sm dark:border-amber-800 dark:bg-slate-900/80 dark:text-amber-300"
                            >
                                <span className="text-lg">🎯</span>
                                Talent Scout Track
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.1 }}
                                className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
                            >
                                Hire the person,
                                <span className="block bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                                    not just the résumé.
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.2 }}
                                className="text-xl leading-relaxed text-slate-600 dark:text-slate-300"
                            >
                                Every candidate in our pipeline has been AI-assessed. You get interview scores, archetype badges, and communication ratings before the first call.
                            </motion.p>

                            {/* Features pills */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.3 }}
                                className="flex flex-wrap gap-3"
                            >
                                {["AI-Assessed Candidates", "Archetype Matching", "Zero ATS Setup", "Direct Job Posting"].map((p) => (
                                    <div
                                        key={p}
                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                                        {p}
                                    </div>
                                ))}
                            </motion.div>

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.4 }}
                                className="flex flex-wrap items-center gap-4"
                            >
                                {isSignedIn ? (
                                    <button
                                        onClick={() => router.push("/dashboard")}
                                        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 opacity-0 transition-opacity group-hover:opacity-100" />
                                        <span className="relative">Go to Dashboard →</span>
                                    </button>
                                ) : (
                                    <SignUpButton mode="modal">
                                        <button className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                                            <span className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 opacity-0 transition-opacity group-hover:opacity-100" />
                                            <span className="relative flex items-center gap-2">
                                                <Star className="h-5 w-5" /> Create Employer Account
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

                        {/* Right — Mock candidate cards */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.65, delay: 0.3 }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 opacity-10 blur-2xl" />
                            <div className="relative rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-2xl backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/90">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Candidate Pipeline</span>
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                        3 matches
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {MOCK_CANDIDATES.map((c, i) => (
                                        <motion.div
                                            key={c.archetype}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + i * 0.12 }}
                                            className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                                    <div>
                                                        <div className={`text-xs font-semibold rounded px-2 py-0.5 inline-block ${c.bg} ${c.color}`}>
                                                            {c.archetype}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.status === "Available"
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                                    }`}>
                                                    {c.status === "Available" ? `Score: ${c.score}%` : c.status}
                                                </div>
                                            </div>
                                            {c.status === "Available" && (
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                    <div className="rounded bg-white px-2 py-1.5 text-center dark:bg-slate-900/60">Comms: {c.comms}</div>
                                                    <div className="rounded bg-white px-2 py-1.5 text-center dark:bg-slate-900/60">Tech Fit: {c.techFit}</div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
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

            {/* ── Values ────────────────────────────────────────────────── */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16 text-center"
                    >
                        <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                            Built for Talent Scouts
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500 dark:text-slate-400">
                            Every feature is designed to remove friction and surface the right hire faster.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {VALUES.map((v, i) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${v.bg}`}>
                                    <v.icon className={`h-5 w-5 ${v.color}`} />
                                </div>
                                <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">{v.title}</h3>
                                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{v.description}</p>
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
                            How Talent Scouts hire smarter
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
                                <div className={`mb-4 inline-block rounded-xl bg-gradient-to-r ${s.gradient} px-3 py-1 text-sm font-bold text-white`}>
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
            <section className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 py-24">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                <div className="absolute -left-20 top-0 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

                <div className="relative mx-auto max-w-3xl px-6 text-center">
                    <h2 className="text-4xl font-bold text-white sm:text-5xl">Find the signal in the noise.</h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                        Stop sifting through unqualified resumes. Start seeing AI-assessed candidates who are ready to impress.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        {isSignedIn ? (
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                            >
                                Go to Dashboard →
                            </button>
                        ) : (
                            <SignUpButton mode="modal">
                                <button className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                                    Create Employer Account →
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
