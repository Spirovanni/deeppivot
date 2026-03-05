"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";

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

interface MatchedCandidate {
    userId: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    anonymizedLabel?: string;
    anonymizedSummary?: string;
    archetypeName: string | null;
    matchScore: number;
    avgInterviewScore: number | null;
    salaryScore: number;
    yearsOfExperience: number | null;
    matchedSkills: string[];
    skills: string[];
    alreadyApplied: boolean;
    alreadyInvited: boolean;
}

const STATUS_OPTIONS = ["new", "reviewing", "rejected", "hired"] as const;
const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    reviewing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    hired: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function EmployerApplicationsPage() {
    const params = useParams<{ jobId: string }>();
    const jobId = params?.jobId;
    const [activeTab, setActiveTab] = useState<"applicants" | "matches">("applicants");
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Applicant | null>(null);
    const [matches, setMatches] = useState<MatchedCandidate[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<MatchedCandidate | null>(null);
    const [inviteBusyUserId, setInviteBusyUserId] = useState<number | null>(null);
    const [blindMode, setBlindMode] = useState(true);
    const [screeningScore, setScreeningScore] = useState<number | null>(null);
    const [screeningScoreReason, setScreeningScoreReason] = useState<string | null>(null);
    const [screeningScoreLoading, setScreeningScoreLoading] = useState(false);

    useEffect(() => {
        fetch(`/api/employer/jobs/${jobId}/applications`)
            .then((r) => r.json())
            .then(setApplicants)
            .finally(() => setLoading(false));

        fetch(`/api/employer/jobs/${jobId}/matches`)
            .then((r) => r.json())
            .then((data) => setMatches(Array.isArray(data?.candidates) ? data.candidates : []))
            .finally(() => setMatchesLoading(false));
    }, [jobId]);

    useEffect(() => {
        if (!jobId || !selectedMatch) {
            setScreeningScore(null);
            setScreeningScoreReason(null);
            return;
        }
        setScreeningScoreLoading(true);
        setScreeningScore(null);
        setScreeningScoreReason(null);
        fetch(`/api/employer/jobs/${jobId}/matches/${selectedMatch.userId}/screening-score`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data: { score?: number; briefReason?: string } | null) => {
                if (data && typeof data.score === "number") {
                    setScreeningScore(data.score);
                    setScreeningScoreReason(data.briefReason ?? null);
                }
            })
            .finally(() => setScreeningScoreLoading(false));
    }, [jobId, selectedMatch?.userId]);

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

    async function inviteCandidate(candidate: MatchedCandidate) {
        if (!jobId || inviteBusyUserId === candidate.userId || candidate.alreadyInvited) return;
        setInviteBusyUserId(candidate.userId);
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ candidateUserId: candidate.userId }),
            });

            if (res.ok) {
                setMatches((prev) =>
                    prev.map((m) =>
                        m.userId === candidate.userId
                            ? { ...m, alreadyInvited: true }
                            : m
                    )
                );
                if (selectedMatch?.userId === candidate.userId) {
                    setSelectedMatch((prev) => (prev ? { ...prev, alreadyInvited: true } : prev));
                }
                return;
            }

            if (res.status === 409) {
                setMatches((prev) =>
                    prev.map((m) =>
                        m.userId === candidate.userId
                            ? { ...m, alreadyInvited: true }
                            : m
                    )
                );
                if (selectedMatch?.userId === candidate.userId) {
                    setSelectedMatch((prev) => (prev ? { ...prev, alreadyInvited: true } : prev));
                }
            }
        } finally {
            setInviteBusyUserId(null);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <a href="/employer/jobs" className="text-white/40 hover:text-white/70 text-sm transition-colors">
                        ← Back to jobs
                    </a>
                    <h1 className="text-2xl font-bold text-white mt-2">Job Management</h1>
                    <p className="text-white/50 text-sm mt-1">Review applicants and discover top candidate matches.</p>
                </div>

                <div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
                    <button
                        onClick={() => setActiveTab("applicants")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "applicants"
                            ? "bg-white/15 text-white"
                            : "text-white/60 hover:text-white/90"
                            }`}
                    >
                        Applicants
                    </button>
                    <button
                        onClick={() => setActiveTab("matches")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "matches"
                            ? "bg-white/15 text-white"
                            : "text-white/60 hover:text-white/90"
                            }`}
                    >
                        Top Candidate Matches
                    </button>
                </div>

                {activeTab === "matches" && (
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                        <div>
                            <p className="text-white text-sm font-medium">Bias-safe sourcing mode</p>
                            <p className="text-white/50 text-xs">Hide candidate identity and prioritize skill signals first.</p>
                        </div>
                        <button
                            onClick={() => setBlindMode((prev) => !prev)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${blindMode
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                : "bg-white/5 text-white/60 border-white/20 hover:text-white/90"
                                }`}
                        >
                            {blindMode ? "Blind Mode: ON" : "Blind Mode: OFF"}
                        </button>
                    </div>
                )}

                {activeTab === "applicants" && (
                    <div className="mb-4 flex justify-end">
                        <a
                            href={`/api/employer/jobs/${jobId}/applications/export`}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"
                        >
                            <Download className="size-4" />
                            Export CSV
                        </a>
                    </div>
                )}

                {activeTab === "applicants" && loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : activeTab === "applicants" ? (
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
                ) : matchesLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex gap-6">
                        {/* Left: match list */}
                        <div className="flex-1 space-y-3">
                            {matches.length === 0 ? (
                                <div className="bg-white/5 rounded-2xl border border-white/10 p-10 text-center">
                                    <p className="text-white/50 text-sm">
                                        No candidate matches available yet. Matches refresh as profiles and jobs are processed.
                                    </p>
                                </div>
                            ) : (
                                matches.map((candidate) => (
                                    <button
                                        key={candidate.userId}
                                        onClick={() => setSelectedMatch(candidate)}
                                        className={`w-full text-left bg-white/5 rounded-xl border p-4 flex items-center gap-4 transition-all hover:border-white/20 ${selectedMatch?.userId === candidate.userId ? "border-indigo-500/50" : "border-white/10"
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                                            {!blindMode && candidate.avatarUrl ? (
                                                <img src={candidate.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                blindMode ? "?" : candidate.name.slice(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-sm font-medium truncate">
                                                {blindMode ? (candidate.anonymizedLabel ?? "Candidate") : candidate.name}
                                            </div>
                                            <div className="text-white/40 text-xs truncate">
                                                {blindMode
                                                    ? (candidate.anonymizedSummary ?? "Identity hidden for unbiased review.")
                                                    : candidate.email}
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md text-xs border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                            {candidate.matchScore}% match
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Right: match detail panel */}
                        {selectedMatch && (
                            <div className="w-80 shrink-0 bg-white/5 rounded-2xl border border-white/10 p-6 h-fit sticky top-6">
                                <div className="flex items-start gap-3 mb-5">
                                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                                        {!blindMode && selectedMatch.avatarUrl ? (
                                            <img src={selectedMatch.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            blindMode ? "?" : selectedMatch.name.slice(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-white font-semibold">
                                            {blindMode ? (selectedMatch.anonymizedLabel ?? "Candidate") : selectedMatch.name}
                                        </div>
                                        <div className="text-white/50 text-xs mt-0.5">
                                            {blindMode ? "Identity hidden until you choose to invite." : selectedMatch.email}
                                        </div>
                                    </div>
                                </div>

                                {blindMode && (
                                    <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
                                        <div className="text-white/50 text-xs mb-1">Anonymized Summary</div>
                                        <p className="text-white/75 text-xs leading-relaxed">
                                            {selectedMatch.anonymizedSummary ?? "Signal-focused profile for unbiased sourcing."}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                                        <div className="text-white/40 text-[11px]">Match Score</div>
                                        <div className="text-indigo-300 text-sm font-semibold">{selectedMatch.matchScore}%</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                                        <div className="text-white/40 text-[11px]">Interview</div>
                                        <div className="text-white/80 text-sm font-semibold">
                                            {selectedMatch.avgInterviewScore != null ? `${selectedMatch.avgInterviewScore}%` : "—"}
                                        </div>
                                    </div>
                                    <div className="col-span-2 bg-white/5 border border-white/10 rounded-lg p-2.5">
                                        <div className="text-white/40 text-[11px]">AI Resume Fit</div>
                                        {screeningScoreLoading ? (
                                            <div className="text-white/50 text-xs">Analyzing resume…</div>
                                        ) : screeningScore != null ? (
                                            <div>
                                                <div className="text-amber-300 text-sm font-semibold">{screeningScore}%</div>
                                                {screeningScoreReason && (
                                                    <p className="text-white/60 text-[11px] mt-1 line-clamp-2">{screeningScoreReason}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-white/50 text-xs">No resume or unable to score</div>
                                        )}
                                    </div>
                                </div>

                                {selectedMatch.archetypeName && (
                                    <div className="mb-4">
                                        <div className="text-white/50 text-xs mb-1.5">Archetype</div>
                                        <div className="text-white/80 text-sm">{selectedMatch.archetypeName}</div>
                                    </div>
                                )}

                                {selectedMatch.matchedSkills.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-white/50 text-xs mb-2">Matched Skills</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedMatch.matchedSkills.slice(0, 6).map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="px-2 py-0.5 rounded-md text-[11px] border border-green-500/30 text-green-300 bg-green-500/10"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => inviteCandidate(selectedMatch)}
                                    disabled={selectedMatch.alreadyInvited || inviteBusyUserId === selectedMatch.userId}
                                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedMatch.alreadyInvited
                                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                                        : "bg-indigo-500 hover:bg-indigo-600 text-white"
                                        }`}
                                >
                                    {inviteBusyUserId === selectedMatch.userId
                                        ? "Inviting..."
                                        : selectedMatch.alreadyInvited
                                            ? "Invite Sent"
                                            : "Invite to Apply"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
