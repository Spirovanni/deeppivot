"use client";

import { switchToEmployer } from "@/src/lib/actions/onboarding";
import { Briefcase, ArrowRight } from "lucide-react";

export function SwitchToEmployerCard() {
    return (
        <form action={switchToEmployer}>
            <button
                type="submit"
                className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20"
            >
                <div className="flex items-center gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                        <Briefcase className="size-5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                Switch to Employer Mode
                            </span>
                            <ArrowRight className="size-4 text-slate-400" />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Looking to hire? Set up your company profile and post jobs to our talent network.
                        </p>
                    </div>
                </div>
            </button>
        </form>
    );
}
