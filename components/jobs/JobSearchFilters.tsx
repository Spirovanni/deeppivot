"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const JOB_TYPES = [
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
];
const EXPERIENCE_LEVELS = [
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior" },
    { value: "executive", label: "Executive" },
];

export function JobSearchFilters({ initialKeyword }: { initialKeyword?: string }) {
    const router = useRouter();
    const pathname = usePathname() ?? "/jobs";
    const searchParams = useSearchParams();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [q, setQ] = useState(searchParams?.get("q") ?? initialKeyword ?? "");
    const [location, setLocation] = useState(searchParams?.get("location") ?? "");
    const [jobType, setJobType] = useState(searchParams?.get("jobType") ?? "");
    const [experienceLevel, setExperienceLevel] = useState(searchParams?.get("experienceLevel") ?? "");
    const [remoteOnly, setRemoteOnly] = useState(searchParams?.get("remoteFlag") === "true");
    const [salaryMin, setSalaryMin] = useState(searchParams?.get("salaryMin") ?? "");
    const [salaryMax, setSalaryMax] = useState(searchParams?.get("salaryMax") ?? "");

    function buildParams() {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (location) params.set("location", location);
        if (jobType) params.set("jobType", jobType);
        if (experienceLevel) params.set("experienceLevel", experienceLevel);
        if (remoteOnly) params.set("remoteFlag", "true");
        if (salaryMin) params.set("salaryMin", salaryMin);
        if (salaryMax) params.set("salaryMax", salaryMax);
        return params;
    }

    function push(immediate = false) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (immediate) {
            router.push(`${pathname}?${buildParams()}`);
        } else {
            debounceRef.current = setTimeout(() => {
                router.push(`${pathname}?${buildParams()}`);
            }, 500);
        }
    }

    // For keyword: debounce
    function handleQChange(v: string) {
        setQ(v);
        push();
    }

    function handleImmediateChange(cb: () => void) {
        cb();
        setTimeout(() => push(true), 0);
    }

    function clearAll() {
        setQ("");
        setLocation("");
        setJobType("");
        setExperienceLevel("");
        setRemoteOnly(false);
        setSalaryMin("");
        setSalaryMax("");
        router.push(pathname);
    }

    const hasFilters = q || location || jobType || experienceLevel || remoteOnly || salaryMin || salaryMax;

    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
            {/* Keyword */}
            <div>
                <label className="block text-white/50 text-xs mb-1.5">Keyword</label>
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={q}
                        onChange={(e) => handleQChange(e.target.value)}
                        placeholder="Job title, skills..."
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-9 pr-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                    />
                </div>
            </div>

            {/* Location */}
            <div>
                <label className="block text-white/50 text-xs mb-1.5">Location</label>
                <input
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); push(); }}
                    placeholder="City, state..."
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                />
            </div>

            {/* Job Type */}
            <div>
                <label className="block text-white/50 text-xs mb-1.5">Job Type</label>
                <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => handleImmediateChange(() => setJobType(jobType === t.value ? "" : t.value))}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${jobType === t.value
                                    ? "bg-indigo-500 text-white"
                                    : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Experience Level */}
            <div>
                <label className="block text-white/50 text-xs mb-1.5">Experience</label>
                <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_LEVELS.map((l) => (
                        <button
                            key={l.value}
                            onClick={() => handleImmediateChange(() => setExperienceLevel(experienceLevel === l.value ? "" : l.value))}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${experienceLevel === l.value
                                    ? "bg-indigo-500 text-white"
                                    : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                                }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Remote toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
                <div
                    onClick={() => handleImmediateChange(() => setRemoteOnly(!remoteOnly))}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${remoteOnly ? "bg-indigo-500" : "bg-white/20"}`}
                >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${remoteOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-white/60 text-sm">Remote only</span>
            </label>

            {/* Salary range */}
            <div>
                <label className="block text-white/50 text-xs mb-1.5">Salary Range (USD/yr)</label>
                <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        value={salaryMin}
                        onChange={(e) => { setSalaryMin(e.target.value); push(); }}
                        placeholder="Min"
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                    />
                    <span className="text-white/30 text-xs">–</span>
                    <input
                        type="number"
                        value={salaryMax}
                        onChange={(e) => { setSalaryMax(e.target.value); push(); }}
                        placeholder="Max"
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                    />
                </div>
            </div>

            {hasFilters && (
                <button
                    onClick={clearAll}
                    className="w-full py-2 text-white/50 hover:text-white/80 text-xs transition-colors"
                >
                    Clear all filters
                </button>
            )}
        </div>
    );
}
