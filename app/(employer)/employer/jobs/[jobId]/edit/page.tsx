"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JobForm } from "@/components/employer/JobForm";

interface JobDetail {
    id: number;
    companyId: number;
    title: string;
    description: string;
    location: string;
    jobType: string;
    experienceLevel: string;
    salaryMin: number | null;
    salaryMax: number | null;
    remoteFlag: boolean;
    status: string;
}

export default function EditJobPage() {
    const params = useParams<{ jobId: string }>();
    const jobId = params?.jobId;
    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!jobId) return;
        fetch(`/api/jobs/${jobId}`)
            .then((r) => r.json())
            .then(setJob)
            .finally(() => setLoading(false));
    }, [jobId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <a
                        href="/employer/jobs"
                        className="text-white/40 hover:text-white/70 text-sm transition-colors"
                    >
                        ← Back to jobs
                    </a>
                    <h1 className="text-2xl font-bold text-white mt-3">Edit Job</h1>
                </div>
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10 backdrop-blur">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : job ? (
                        <JobForm
                            jobId={job.id}
                            initialValues={{
                                companyId: job.companyId,
                                title: job.title,
                                description: job.description,
                                location: job.location,
                                jobType: job.jobType,
                                experienceLevel: job.experienceLevel,
                                salaryMin: job.salaryMin ? String(job.salaryMin / 100) : "",
                                salaryMax: job.salaryMax ? String(job.salaryMax / 100) : "",
                                remoteFlag: job.remoteFlag,
                                status: job.status,
                            }}
                        />
                    ) : (
                        <p className="text-white/60 text-sm">Job not found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
