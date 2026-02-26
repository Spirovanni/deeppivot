import { JobForm } from "@/components/employer/JobForm";

export default function NewJobPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <a
                        href="/employer/jobs"
                        className="text-white/40 hover:text-white/70 text-sm transition-colors flex items-center gap-1"
                    >
                        ← Back to jobs
                    </a>
                    <h1 className="text-2xl font-bold text-white mt-3">Post a New Job</h1>
                </div>
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10 backdrop-blur">
                    <JobForm />
                </div>
            </div>
        </div>
    );
}
