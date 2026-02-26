"use client";

import { useState } from "react";

interface ApplyModalProps {
    jobId: number;
    jobTitle: string;
    companyName: string;
    boardId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function ApplyModal({ jobId, jobTitle, companyName, boardId, onClose, onSuccess }: ApplyModalProps) {
    const [resumeUrl, setResumeUrl] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/jobs/${jobId}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeUrl: resumeUrl || null, coverLetter: coverLetter || null, boardId }),
            });
            const data = await res.json();
            if (res.status === 409) throw new Error("You've already applied for this job.");
            if (res.status === 410) throw new Error("This job is no longer accepting applications.");
            if (!res.ok) throw new Error(data.error ?? "Failed to submit application");
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="mb-5">
                    <h2 className="text-lg font-bold text-white">Apply for {jobTitle}</h2>
                    <p className="text-white/50 text-sm mt-0.5">{companyName}</p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-white/70 text-sm mb-1">Resume URL</label>
                        <input
                            value={resumeUrl}
                            onChange={(e) => setResumeUrl(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                        />
                        <p className="text-white/30 text-xs mt-1">Link to your resume (Google Drive, Dropbox, etc.)</p>
                    </div>
                    <div>
                        <label className="block text-white/70 text-sm mb-1">Cover Letter</label>
                        <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            rows={5}
                            placeholder="Tell the employer why you're a great fit..."
                            className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
                        >
                            {loading ? "Submitting..." : "Submit Application"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
