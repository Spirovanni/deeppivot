import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { companiesTable, jobsTable } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-yellow-500/20 text-yellow-400",
    published: "bg-green-500/20 text-green-400",
    closed: "bg-white/10 text-white/40",
    removed: "bg-red-500/20 text-red-400",
};

export default async function AdminJobsPage() {
    await requireAdmin();

    const jobs = await db
        .select({
            id: jobsTable.id,
            title: jobsTable.title,
            status: jobsTable.status,
            jobType: jobsTable.jobType,
            createdAt: jobsTable.createdAt,
            companyName: companiesTable.name,
            companyId: companiesTable.id,
        })
        .from(jobsTable)
        .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
        .orderBy(desc(jobsTable.createdAt))
        .limit(100);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Job Moderation</h1>
                <p className="text-white/50 text-sm mt-1">Review and manage all job postings</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left text-white/50 font-medium px-4 py-3">Job</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Company</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Type</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Status</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Posted</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                <td className="px-4 py-3">
                                    <Link href={`/jobs/${job.id}`} className="text-white hover:text-indigo-300 transition-colors">
                                        {job.title}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-white/60">{job.companyName}</td>
                                <td className="px-4 py-3 text-white/60 capitalize">{job.jobType.replace("_", " ")}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-md text-xs capitalize ${STATUS_COLORS[job.status] ?? ""}`}>
                                        {job.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white/40 text-xs">
                                    {new Date(job.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        {job.status === "published" && (
                                            <form action={`/api/jobs/${job.id}`} method="PATCH">
                                                <button
                                                    formAction={`/api/admin/jobs/${job.id}/remove`}
                                                    className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 rounded-lg text-xs transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </form>
                                        )}
                                        <Link
                                            href={`/employer/jobs/${job.id}/edit`}
                                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-lg text-xs transition-colors"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {jobs.length === 0 && (
                    <div className="p-10 text-center text-white/40 text-sm">No jobs yet.</div>
                )}
            </div>
        </div>
    );
}
