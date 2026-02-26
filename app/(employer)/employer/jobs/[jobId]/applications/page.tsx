"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Applicant {
    id: number;
    status: string;
    resumeUrl: string | null;
    coverLetter: string | null;
    createdAt: string;
    userId: number;
    applicantName: string;
    applicantEmail: string;
    applicantAvatarUrl: string | null;
}

const STATUS_OPTIONS = ["new", "reviewing", "rejected", "hired"] as const;
const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    reviewing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    hired: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function EmployerApplicationsPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Applicant | null>(null);

    useEffect(() => {
        fetch(`/api/employer/jobs/${jobId}/applications`)
            .then((r) => r.json())
            .then(setApplicants)
            .finally(() => setLoading(false));
    }, [jobId]);

    async function updateStatus(appId: number, status: string) {
        const res = await fetch(`/api/employer/applications/${appId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            setApplicants((prev) =>
                prev.map((a) => (a.id === appId ? { ...a, status } : a))
            );
            if (selected?.id === appId) setSelected((prev) => prev ? { ...prev, status } : prev);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <a href="/employer/jobs" className="text-white/40 hover:text-white/70 text-sm transition-colors">
                        ← Back to jobs
                    </a>
                    <h1 className="text-2xl font-bold text-white mt-2">Applicants</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex gap-6">
                        {/* Left: applicant list */}
                        <div className="flex-1 space-y-3">
                            {applicants.length === 0 ? (
                                <div className="bg-white/5 rounded-2xl border border-white/10 p-10 text-center">
                                    <p className="text-white/50 text-sm">No applicants yet.</p>
                                </div>
                            ) : (
                                applicants.map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() => setSelected(a)}
                                        className={`w-full text-left bg-white/5 rounded-xl border p-4 flex items-center gap-4 transition-all hover:border-white/20 ${selected?.id === a.id ? "border-indigo-500/50" : "border-white/10"
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                                            {a.applicantAvatarUrl ? (
                                                <img src={a.applicantAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                a.applicantName.slice(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-sm font-medium truncate">{a.applicantName}</div>
                                            <div className="text-white/40 text-xs truncate">{a.applicantEmail}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-md text-xs border capitalize ${STATUS_COLORS[a.status] ?? ""}`}>
                                            {a.status}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Right: applicant detail panel */}
                        {selected && (
                            <div className="w-80 shrink-0 bg-white/5 rounded-2xl border border-white/10 p-6 h-fit sticky top-6">
                                <div className="flex items-start gap-3 mb-5">
                                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                                        {selected.applicantAvatarUrl ? (
                                            <img src={selected.applicantAvatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            selected.applicantName.slice(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold">{selected.applicantName}</div>
                                        <div className="text-white/50 text-xs mt-0.5">{selected.applicantEmail}</div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="text-white/50 text-xs mb-2">Applied</div>
                                    <div className="text-white/80 text-sm">{new Date(selected.createdAt).toLocaleDateString()}</div>
                                </div>

                                {selected.resumeUrl && (
                                    <div className="mb-4">
                                        <div className="text-white/50 text-xs mb-2">Resume</div>
                                        <a
                                            href={selected.resumeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-400 hover:text-indigo-300 text-sm underline"
                                        >
                                            View Resume →
                                        </a>
                                    </div>
                                )}

                                {selected.coverLetter && (
                                    <div className="mb-5">
                                        <div className="text-white/50 text-xs mb-2">Cover Letter</div>
                                        <p className="text-white/70 text-xs leading-relaxed line-clamp-4">{selected.coverLetter}</p>
                                    </div>
                                )}

                                <div>
                                    <div className="text-white/50 text-xs mb-2">Update Status</div>
                                    <div className="flex flex-wrap gap-2">
                                        {STATUS_OPTIONS.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => updateStatus(selected.id, s)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${selected.status === s
                                                        ? STATUS_COLORS[s]
                                                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
