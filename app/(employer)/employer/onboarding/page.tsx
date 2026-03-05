"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3;

export default function EmployerOnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 2: company fields
    const [companyName, setCompanyName] = useState("");
    const [companyWebsite, setCompanyWebsite] = useState("");
    const [companyIndustry, setCompanyIndustry] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [companyLocation, setCompanyLocation] = useState("");
    const [companyDescription, setCompanyDescription] = useState("");
    const [companyId, setCompanyId] = useState<number | null>(null);

    async function handleCreateCompany(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/companies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: companyName,
                    website: companyWebsite,
                    industry: companyIndustry,
                    size: companySize,
                    location: companyLocation,
                    description: companyDescription,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "Failed to create company");
            }
            const company = await res.json();
            setCompanyId(company.id);
            setStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
                {/* Progress Steps */}
                <div className="flex items-center gap-2 mb-10">
                    {([1, 2, 3] as const).map((s) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step >= s
                                    ? "bg-indigo-500 text-white"
                                    : "bg-white/10 text-white/40"
                                    }`}
                            >
                                {s}
                            </div>
                            {s < 3 && (
                                <div className={`flex-1 h-0.5 ${step > s ? "bg-indigo-500" : "bg-white/10"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Intent */}
                {step === 1 && (
                    <div className="bg-white/5 rounded-2xl p-8 border border-white/10 backdrop-blur">
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome, Employer!</h1>
                        <p className="text-white/60 mb-8 text-sm leading-relaxed">
                            You&apos;re about to set up your employer profile on DeepPivot. You&apos;ll be able to post jobs, review
                            applicants, and connect with motivated learners.
                        </p>
                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
                        >
                            Set up my company →
                        </button>
                    </div>
                )}

                {/* Step 2: Create Company */}
                {step === 2 && (
                    <form
                        onSubmit={handleCreateCompany}
                        className="bg-white/5 rounded-2xl p-8 border border-white/10 backdrop-blur space-y-4"
                    >
                        <h2 className="text-2xl font-bold text-white mb-1">Company Profile</h2>
                        <p className="text-white/60 text-sm mb-4">Tell us about your company.</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-white/70 text-sm mb-1">Company Name *</label>
                            <input
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Acme Inc."
                                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-white/70 text-sm mb-1">Industry</label>
                                <input
                                    value={companyIndustry}
                                    onChange={(e) => setCompanyIndustry(e.target.value)}
                                    placeholder="Technology"
                                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                                />
                            </div>
                            <div>
                                <label htmlFor="companySize" className="block text-white/70 text-sm mb-1">Company Size</label>
                                <select
                                    id="companySize"
                                    value={companySize}
                                    onChange={(e) => setCompanySize(e.target.value)}
                                    className="w-full bg-[#1a1a2e] border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition"
                                >
                                    <option value="">Select size</option>
                                    {["1-10", "11-50", "51-200", "201-500", "500+"].map((s) => (
                                        <option key={s} value={s}>{s} employees</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-white/70 text-sm mb-1">Website</label>
                                <input
                                    value={companyWebsite}
                                    onChange={(e) => setCompanyWebsite(e.target.value)}
                                    placeholder="https://acme.com"
                                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-white/70 text-sm mb-1">Location</label>
                                <input
                                    value={companyLocation}
                                    onChange={(e) => setCompanyLocation(e.target.value)}
                                    placeholder="San Francisco, CA"
                                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-white/70 text-sm mb-1">Description</label>
                            <textarea
                                value={companyDescription}
                                onChange={(e) => setCompanyDescription(e.target.value)}
                                rows={3}
                                placeholder="Brief description of what your company does..."
                                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-400 transition resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
                        >
                            {loading ? "Creating..." : "Create Company →"}
                        </button>
                    </form>
                )}

                {/* Step 3: First job prompt */}
                {step === 3 && (
                    <div className="bg-white/5 rounded-2xl p-8 border border-white/10 backdrop-blur text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h2>
                        <p className="text-white/60 text-sm mb-8">
                            Your company profile is ready. Ready to post your first job?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push(`/employer/jobs/new?companyId=${companyId}`)}
                                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
                            >
                                Post a job
                            </button>
                            <button
                                onClick={() => router.push("/employer/jobs")}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
                            >
                                Go to dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
