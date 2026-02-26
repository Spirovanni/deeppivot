import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { companiesTable, usersTable } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function AdminEmployersPage() {
    await requireAdmin();

    const employers = await db
        .select({
            userId: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: usersTable.role,
            status: usersTable.status,
            isSuspended: usersTable.isSuspended,
            createdAt: usersTable.createdAt,
            companyId: companiesTable.id,
            companyName: companiesTable.name,
        })
        .from(usersTable)
        .leftJoin(companiesTable, eq(companiesTable.ownerUserId, usersTable.id))
        .where(eq(usersTable.role, "employer"))
        .orderBy(desc(usersTable.createdAt))
        .limit(100);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Employer Management</h1>
                <p className="text-white/50 text-sm mt-1">Manage employer accounts and company profiles</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left text-white/50 font-medium px-4 py-3">Employer</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Company</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Status</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Joined</th>
                            <th className="text-left text-white/50 font-medium px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employers.map((emp) => (
                            <tr key={emp.userId} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="text-white">{emp.name}</div>
                                    <div className="text-white/40 text-xs">{emp.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {emp.companyName ? (
                                        <Link
                                            href={`/api/companies/${emp.companyId}`}
                                            className="text-indigo-300 hover:text-indigo-200 text-xs"
                                        >
                                            {emp.companyName}
                                        </Link>
                                    ) : (
                                        <span className="text-white/30 text-xs">No company</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-0.5 rounded-md text-xs ${emp.isSuspended
                                                ? "bg-red-500/20 text-red-400"
                                                : "bg-green-500/20 text-green-400"
                                            }`}
                                    >
                                        {emp.isSuspended ? "Suspended" : "Active"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white/40 text-xs">
                                    {new Date(emp.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        {emp.companyName && (
                                            <Link
                                                href={`/employer/jobs?companyId=${emp.companyId}`}
                                                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-lg text-xs transition-colors"
                                            >
                                                View Jobs
                                            </Link>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {employers.length === 0 && (
                    <div className="p-10 text-center text-white/40 text-sm">No employers yet.</div>
                )}
            </div>
        </div>
    );
}
