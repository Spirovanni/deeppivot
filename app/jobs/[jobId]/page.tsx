"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApplyModal } from "@/components/jobs/ApplyModal";
import Link from "next/link";

interface Job {
    id: number;
    title: string;
    description: string;
    location: string | null;
    jobType: string;
    experienceLevel: string;
    salaryMin: number | null;
    salaryMax: number | null;
    remoteFlag: boolean;
    status: string;
    createdAt: string;
    companyId: number;
    companyName: string;
    companyLogoUrl: string | null;
    companyWebsite: string | null;
    companyDescription: string | null;
    companyLocation: string | null;
    companyIndustry: string | null;
    companySize: string | null;
}

const TYPE_LABELS: Record<string, string> = {
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Internship",
};

const LEVEL_LABELS: Record<string, string> = {
    entry: "Entry Level",
    mid: "Mid Level",
    senior: "Senior",
    executive: "Executive",
};

function formatSalary(min: number | null, max: number | null) {
    if (!min && !max) return "Salary not disclosed";
    const fmt = (v: number) => `$${Math.round(v / 100).toLocaleString()}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} / year`;
    if (min) return `From ${fmt(min)} / year`;
    return `Up to ${fmt(max!)} / year`;
}

export default function JobDetailPage() {
    const params = useParams<{ jobId: string }>();
    const jobId = params?.jobId;
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [applySuccess, setApplySuccess] = useState(false);
    const [boardId, setBoardId] = useState<number | null>(null);

    useEffect(() => {
        fetch(`/api/jobs/${jobId}`)
            .then((r) => r.json())
            .then(setJob)
            .finally(() => setLoading(false));

        // Fetch user's default board ID
        fetch("/api/job-board")
            .then((r) => r.json())
            .then((boards) => boards?.[0]?.id && setBoardId(boards[0].id))
            .catch(() => { });

        // Check if already applied
        fetch("/api/me/applications")
            .then((r) => r.json())
            .then((apps: { jobId: number }[]) => {
                if (Array.isArray(apps) && apps.some((a) => a.jobId === parseInt(jobId))) {
                    setHasApplied(true);
                }
            })
            .catch(() => { });
    }, [jobId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white/60 mb-4">Job not found.</p>
                    <Link href="/jobs" className="text-indigo-400 hover:text-indigo-300 text-sm">
                        ← Back to marketplace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/jobs" className="text-white/40 hover:text-white/70 text-sm transition-colors">
                        ← Job Marketplace
                    </Link>
                </div>

                <div className="flex gap-6">
                    {/* Main content */}
                    <div className="flex-1">
                        {/* Job header */}
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-2xl shrink-0">
                                    {job.companyLogoUrl ? (
                                        <img src={job.companyLogoUrl} alt={job.companyName} className="w-16 h-16 rounded-xl object-cover" />
                                    ) : (
                                        job.companyName.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-white">{job.title}</h1>
                                    <p className="text-indigo-300 mt-0.5">
                                        {job.companyWebsite ? (
                                            <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                {job.companyName}
                                            </a>
                                        ) : (
                                            job.companyName
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Metadata tags */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                <span className="px-3 py-1 bg-white/10 text-white/70 rounded-lg text-sm">
                                    {TYPE_LABELS[job.jobType] ?? job.jobType}
                                </span>
                                <span className="px-3 py-1 bg-white/10 text-white/70 rounded-lg text-sm">
                                    {LEVEL_LABELS[job.experienceLevel] ?? job.experienceLevel}
                                </span>
                                {job.remoteFlag && (
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm">
                                        🌐 Remote
                                    </span>
                                )}
                                {job.location && (
                                    <span className="px-3 py-1 bg-white/10 text-white/70 rounded-lg text-sm">
                                        📍 {job.location}
                                    </span>
                                )}
                            </div>

                            {/* Salary */}
                            <div className="mt-3 text-white/60 text-sm">
                                💰 {formatSalary(job.salaryMin, job.salaryMax)}
                            </div>

                            {/* CTA */}
                            <div className="mt-5">
                                {job.status === "closed" ? (
                                    <div className="px-6 py-2.5 bg-white/10 text-white/40 rounded-xl text-sm font-medium text-center">
                                        This position is closed
                                    </div>
                                ) : applySuccess || hasApplied ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 px-6 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-medium text-center">
                                            ✓ Application Submitted
                                        </div>
                                        <Link
                                            href="/dashboard/job-tracker"
                                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl text-sm transition-colors"
                                        >
                                            View Tracker →
                                        </Link>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (!boardId) {
                                                router.push("/dashboard/job-tracker");
                                                return;
                                            }
                                            setShowModal(true);
                                        }}
                                        className="w-full px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
                                    >
                                        Apply Now
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Job description */}
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Job Description</h2>
                            <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </div>
                    </div>

                    {/* Company sidebar */}
                    <div className="w-64 shrink-0 space-y-4">
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                            <h3 className="text-white font-semibold text-sm mb-3">About the Company</h3>
                            {job.companyDescription && (
                                <p className="text-white/60 text-xs leading-relaxed mb-3">{job.companyDescription}</p>
                            )}
                            <div className="space-y-1.5 text-xs">
                                {job.companyIndustry && (
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Industry</span>
                                        <span className="text-white/70">{job.companyIndustry}</span>
                                    </div>
                                )}
                                {job.companySize && (
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Size</span>
                                        <span className="text-white/70">{job.companySize} employees</span>
                                    </div>
                                )}
                                {job.companyLocation && (
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Location</span>
                                        <span className="text-white/70">{job.companyLocation}</span>
                                    </div>
                                )}
                            </div>
                            {job.companyWebsite && (
                                <a
                                    href={job.companyWebsite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 block text-center py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl text-xs transition-colors"
                                >
                                    Visit Website →
                                </a>
                            )}
                        </div>

                        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                            <div className="text-white/50 text-xs">Posted</div>
                            <div className="text-white/80 text-sm mt-0.5">
                                {new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && boardId && (
                <ApplyModal
                    jobId={job.id}
                    jobTitle={job.title}
                    companyName={job.companyName}
                    boardId={boardId}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        setApplySuccess(true);
                    }}
                />
            )}
        </div>
    );
}
