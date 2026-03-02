"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Trophy, Star, Zap, Flame } from "lucide-react";

export function GamificationSection() {
    return (
        <section className="relative w-full overflow-hidden bg-slate-50 py-24 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#8080800a_1px,transparent_1px)] bg-[size:3rem_3rem]" />

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                    {/* Left side: Visuals */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-600 to-pink-600 opacity-10 blur-2xl" />
                        <div className="relative rounded-2xl border border-slate-200/50 bg-white/20 p-4 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-white/5 ring-1 ring-white/10">
                            <Image
                                src="/gamification-mock.png"
                                alt="Gamification showcase"
                                width={600}
                                height={600}
                                className="w-full h-auto rounded-xl shadow-lg"
                            />
                        </div>

                        {/* Floating elements */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -right-6 top-10 rounded-xl bg-white p-4 shadow-xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/40">
                                    <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">7 Day Streak!</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Keep it up, Trailblazer</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -left-6 bottom-10 rounded-xl bg-white p-4 shadow-xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-violet-100 p-2 dark:bg-violet-900/40">
                                    <Trophy className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">+150 XP</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Interview Master Unlocked</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right side: Content */}
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-sm dark:border-violet-800 dark:bg-slate-900/80 dark:text-violet-300">
                                <Star className="h-4 w-4 fill-violet-500" />
                                Gamified Learning Experience
                            </div>
                            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                                Level up your career
                                <span className="block bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                                    one step at a time
                                </span>
                            </h2>
                            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                                DeepPivot turns career development into a rewarding journey. Stay motivated, earn achievements, and track your growth with a platform built to keep you moving forward.
                            </p>
                        </motion.div>

                        <div className="mt-10 space-y-8">
                            {[
                                {
                                    icon: Zap,
                                    title: "Weekly Streaks",
                                    description: "Build a habit of daily practice and keep your streak alive to unlock exclusive rewards and boosters.",
                                    color: "text-amber-500",
                                    bg: "bg-amber-50 dark:bg-amber-950/30"
                                },
                                {
                                    icon: Trophy,
                                    title: "Achievement Badges",
                                    description: "Earn unique badges across 10+ categories as you master interviews, perfect your resume, and reach career milestones.",
                                    color: "text-violet-500",
                                    bg: "bg-violet-50 dark:bg-violet-950/30"
                                },
                                {
                                    icon: Star,
                                    title: "Skill Points (XP)",
                                    description: "Gain experience points for every action you take. Watch your level grow as you develop the skills that matter to employers.",
                                    color: "text-pink-500",
                                    bg: "bg-pink-50 dark:bg-pink-950/30"
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="flex gap-4"
                                >
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                                        <item.icon className={`h-6 w-6 ${item.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                                        <p className="mt-1 text-slate-600 dark:text-slate-400">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
