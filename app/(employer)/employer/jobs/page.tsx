"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
    id: number;
    title: string;
    status: string;
    jobType: string;
    location: string | null;
    remoteFlag: boolean;
    createdAt: string;
    companyName: string;
    applicationCount?: number;
}

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    published: "bg-green-500/20 text-green-400 border-green-500/30",
    closed: "bg-white/10 text-white/40 border-white/10",
};

const TYPE_LABELS: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
};

export default function EmployerJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch employer's own jobs including all statuses
        fetch("/api/jobs?includeOwn=true&limit=50")
            .then((r) => r.json())
            .then((data) => setJobs(data.jobs ?? []))
            .finally(() => setLoading(false));
    }, []);

    async function toggleStatus(job: Job) {
        const next = job.status === "published" ? "closed" : "published";
        const res = await fetch(`/api/jobs/${job.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: next }),
        });
        if (res.ok) {
            setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: next } : j)));
        }
    }

    async function closeJob(jobId: number) {
        if (!confirm("Close this job posting? It will be removed from the marketplace.")) return;
        const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
        if (res.ok) {
            setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "closed" } : j)));
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Job Dashboard</h1>
                        <p className="text-white/50 text-sm mt-1">Manage your job postings</p>
                    </div>
                    <Link
                        href="/employer/jobs/new"
                        className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Post a Job
                    </Link>
                </div>

                {/* Stats */}
                {!loading && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: "Total Jobs", count: jobs.length, color: "text-white" },
                            { label: "Published", count: jobs.filter((j) => j.status === "published").length, color: "text-green-400" },
                            { label: "Drafts", count: jobs.filter((j) => j.status === "draft").length, color: "text-yellow-400" },
                        ].map((s) => (
                            <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.count}</div>
                                <div className="text-white/50 text-xs">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Jobs list */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
                        <div className="text-4xl mb-4">💼</div>
                        <p className="text-white/60 text-sm mb-4">You haven&apos;t posted any jobs yet.</p>
                        <Link
                            href="/employer/jobs/new"
                            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold text-sm transition-colors"
                        >
                            Post your first job
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-white/5 rounded-xl border border-white/10 p-5 flex items-center gap-4 hover:border-white/20 transition-all group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-white font-semibold text-sm truncate">{job.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-md text-xs border capitalize ${STATUS_COLORS[job.status] ?? STATUS_COLORS.closed}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <p className="text-white/40 text-xs">
                                        {TYPE_LABELS[job.jobType] ?? job.jobType}
                                        {job.location ? ` · ${job.location}` : ""}
                                        {job.remoteFlag ? " · Remote" : ""}
                                        {" · Posted "}{new Date(job.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                        href={`/employer/jobs/${job.id}/applications`}
                                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                        Manage Candidates
                                    </Link>
                                    <Link
                                        href={`/employer/jobs/${job.id}/edit`}
                                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                        Edit
                                    </Link>
                                    {job.status !== "closed" && (
                                        <button
                                            onClick={() => toggleStatus(job)}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg text-xs font-medium transition-colors"
                                        >
                                            {job.status === "published" ? "Unpublish" : "Publish"}
                                        </button>
                                    )}
                                    {job.status !== "closed" && (
                                        <button
                                            onClick={() => closeJob(job.id)}
                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
