import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { count, ilike, isNull, or, desc } from "drizzle-orm";
import Link from "next/link";
import { Users } from "lucide-react";
import { QuickRoleSelect } from "@/components/admin/QuickRoleSelect";

// kept for status badges only
const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    employer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    user: "bg-white/10 text-white/60 border-white/20",
    enterprise_manager: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    mentor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    wdb_partner: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

interface SearchProps {
    searchParams: Promise<{ q?: string; page?: string }>;
}

const PAGE_SIZE = 50;

export default async function AdminUsersPage({ searchParams }: SearchProps) {
    const currentUser = await requireAdmin();
    const { q, page } = await searchParams;
    const pageNum = Math.max(1, parseInt(page ?? "1"));
    const offset = (pageNum - 1) * PAGE_SIZE;

    const whereClause = q
        ? or(ilike(usersTable.name, `%${q}%`), ilike(usersTable.email, `%${q}%`))
        : isNull(usersTable.deletedAt);

    const [users, [{ total }]] = await Promise.all([
        db
            .select({
                id: usersTable.id,
                name: usersTable.name,
                email: usersTable.email,
                role: usersTable.role,
                status: usersTable.status,
                isSuspended: usersTable.isSuspended,
                isPremium: usersTable.isPremium,
                isDeleted: usersTable.isDeleted,
                createdAt: usersTable.createdAt,
            })
            .from(usersTable)
            .where(whereClause ?? undefined)
            .orderBy(desc(usersTable.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset),
        db.select({ total: count() }).from(usersTable).where(whereClause ?? undefined),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Users className="size-5 text-blue-400" />
                    <h1 className="text-xl font-bold">Users</h1>
                    <span className="text-sm text-muted-foreground">({total.toLocaleString()} total)</span>
                </div>
                <a
                    href="/api/admin/export/users"
                    download
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Export All Users (CSV)
                </a>
            </div>

            {/* Search */}
            <form method="GET" className="flex gap-2">
                <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search by name or email..."
                    className="flex-1 rounded-lg border bg-muted/40 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                    type="submit"
                    className="rounded-lg border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    Search
                </button>
                {q && (
                    <Link
                        href="/admin/users"
                        className="rounded-lg border bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80"
                    >
                        Clear
                    </Link>
                )}
            </form>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/30">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{u.name}</div>
                                    <div className="text-xs text-muted-foreground">{u.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <QuickRoleSelect userId={u.id} currentRole={u.role} currentUserRole={currentUser.role} />
                                </td>
                                <td className="px-4 py-3">
                                    {u.isDeleted ? (
                                        <span className="px-2 py-0.5 rounded-md text-xs bg-red-500/20 text-red-400">Deleted</span>
                                    ) : u.isSuspended ? (
                                        <span className="px-2 py-0.5 rounded-md text-xs bg-yellow-500/20 text-yellow-400">Suspended</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-md text-xs bg-green-500/20 text-green-400">Active</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {u.isPremium ? "Pro" : "Free"}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/users/${u.id}`}
                                        className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
                                    >
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground text-sm">No users found.</div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Page {pageNum} of {totalPages}</span>
                    <div className="flex gap-2">
                        {pageNum > 1 && (
                            <Link
                                href={`/admin/users?${q ? `q=${q}&` : ""}page=${pageNum - 1}`}
                                className="px-3 py-1.5 rounded-lg border hover:bg-muted text-xs"
                            >
                                ← Prev
                            </Link>
                        )}
                        {pageNum < totalPages && (
                            <Link
                                href={`/admin/users?${q ? `q=${q}&` : ""}page=${pageNum + 1}`}
                                className="px-3 py-1.5 rounded-lg border hover:bg-muted text-xs"
                            >
                                Next →
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
