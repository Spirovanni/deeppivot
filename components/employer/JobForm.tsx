"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const JOB_TYPES = ["full_time", "part_time", "contract", "internship"] as const;
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "executive"] as const;
const STATUS_OPTIONS = ["draft", "published"] as const;

const labelMap: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
    entry: "Entry Level",
    mid: "Mid Level",
    senior: "Senior",
    executive: "Executive",
};

interface JobFormProps {
    jobId?: number;
    initialValues?: {
        companyId: number;
        title: string;
        description: string;
        location: string;
        jobType: string;
        experienceLevel: string;
        salaryMin: string;
        salaryMax: string;
        remoteFlag: boolean;
        status: string;
    };
}

export function JobForm({ jobId, initialValues }: JobFormProps) {
    const searchParams = useSearchParams();
    const prefilledCompanyId = searchParams.get("companyId");

    const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
    const [companyId, setCompanyId] = useState(initialValues?.companyId?.toString() ?? prefilledCompanyId ?? "");
    const [title, setTitle] = useState(initialValues?.title ?? "");
    const [description, setDescription] = useState(initialValues?.description ?? "");
    const [location, setLocation] = useState(initialValues?.location ?? "");
    const [jobType, setJobType] = useState(initialValues?.jobType ?? "full_time");
    const [experienceLevel, setExperienceLevel] = useState(initialValues?.experienceLevel ?? "mid");
    const [salaryMin, setSalaryMin] = useState(initialValues?.salaryMin ?? "");
    const [salaryMax, setSalaryMax] = useState(initialValues?.salaryMax ?? "");
    const [remoteFlag, setRemoteFlag] = useState(initialValues?.remoteFlag ?? false);
    const [status, setStatus] = useState(initialValues?.status ?? "draft");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/companies")
            .then((r) => r.json())
            .then(setCompanies)
            .catch(console.error);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const body = {
                companyId: parseInt(companyId),
                title,
                description,
                location: location || null,
                jobType,
                experienceLevel,
                salaryMin: salaryMin ? parseInt(salaryMin) * 100 : null, // convert to cents
                salaryMax: salaryMax ? parseInt(salaryMax) * 100 : null,
                remoteFlag,
                status,
            };

            const res = await fetch(jobId ? `/api/jobs/${jobId}` : "/api/jobs", {
                method: jobId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "Failed to save job");
            }
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Job {jobId ? "updated" : "created"}!</h2>
                <p className="text-white/60 text-sm mb-6">
                    {status === "published" ? "Your job is now live in the marketplace." : "Saved as draft."}
                </p>
                <a
                    href="/employer/jobs"
                    className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors text-sm"
                >
                    Back to job dashboard
                </a>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm">
                    {error}
                </div>
            )}

            {/* Company select */}
            {!jobId && (
                <div>
                    <label className="block text-white/70 text-sm mb-1">Company *</label>
                    <select
                        required
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        className="w-full bg-[#1a1a2e] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition"
                    >
                        <option value="">Select your company</option>
                        {companies.map((c) => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-white/70 text-sm mb-1">Job Title *</label>
                <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Senior Frontend Engineer"
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-white/70 text-sm mb-1">Job Type *</label>
                    <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full bg-[#1a1a2e] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition"
                    >
                        {JOB_TYPES.map((t) => <option key={t} value={t}>{labelMap[t]}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-white/70 text-sm mb-1">Experience Level *</label>
                    <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full bg-[#1a1a2e] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition"
                    >
                        {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{labelMap[l]}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-white/70 text-sm mb-1">Location</label>
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="San Francisco, CA"
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                    />
                </div>
                <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 cursor-pointer pb-0.5">
                        <div
                            onClick={() => setRemoteFlag(!remoteFlag)}
                            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${remoteFlag ? "bg-indigo-500" : "bg-white/20"}`}
                        >
                            <div
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${remoteFlag ? "translate-x-5.5" : "translate-x-0.5"}`}
                            />
                        </div>
                        <span className="text-white/70 text-sm">Remote</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-white/70 text-sm mb-1">Salary Min (USD/yr)</label>
                    <input
                        type="number"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        placeholder="60000"
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                    />
                </div>
                <div>
                    <label className="block text-white/70 text-sm mb-1">Salary Max (USD/yr)</label>
                    <input
                        type="number"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        placeholder="90000"
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                    />
                </div>
            </div>

            <div>
                <label className="block text-white/70 text-sm mb-1">Job Description *</label>
                <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition resize-none"
                />
            </div>

            <div className="flex items-center gap-4">
                <div>
                    <label className="block text-white/70 text-sm mb-1">Status</label>
                    <div className="flex gap-2">
                        {STATUS_OPTIONS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(s)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${status === s
                                        ? "bg-indigo-500 text-white"
                                        : "bg-white/10 text-white/60 hover:bg-white/20 text-white"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="ml-auto px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
                >
                    {loading ? "Saving..." : jobId ? "Update Job" : "Post Job"}
                </button>
            </div>
        </form>
    );
}
