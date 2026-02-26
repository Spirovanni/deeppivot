import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { usersTable, interviewSessionsTable, subscriptionsTable } from "@/src/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { UserDetailForm } from "@/components/admin/UserDetailForm";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ userId: string }>;
}

const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400",
    employer: "bg-indigo-500/20 text-indigo-400",
    user: "bg-muted text-muted-foreground",
    enterprise_manager: "bg-orange-500/20 text-orange-400",
};

export default async function UserDetailPage({ params }: Props) {
    await requireAdmin();
    const { userId } = await params;
    const uid = parseInt(userId);
    if (isNaN(uid)) notFound();

    const [user] = await db
        .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: usersTable.role,
            status: usersTable.status,
            isSuspended: usersTable.isSuspended,
            isDeleted: usersTable.isDeleted,
            isPremium: usersTable.isPremium,
            avatarUrl: usersTable.avatarUrl,
            bio: usersTable.bio,
            phone: usersTable.phone,
            linkedinUrl: usersTable.linkedinUrl,
            createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .where(eq(usersTable.id, uid));

    if (!user) notFound();

    const [[{ totalSessions }], [sub]] = await Promise.all([
        db.select({ totalSessions: count() }).from(interviewSessionsTable).where(eq(interviewSessionsTable.userId, uid)),
        db.select({ planId: subscriptionsTable.planId, status: subscriptionsTable.status }).from(subscriptionsTable).where(eq(subscriptionsTable.userId, uid)).limit(1),
    ]);

    const profileFields = [
        { label: "Email", value: user.email },
        { label: "Phone", value: user.phone ?? "—" },
        { label: "Bio", value: user.bio ?? "—" },
        { label: "LinkedIn", value: user.linkedinUrl ?? "—" },
        { label: "Plan", value: sub ? `${sub.planId} (${sub.status})` : "free" },
        { label: "Sessions", value: String(totalSessions) },
        { label: "Joined", value: new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/users" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-4" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
                        ) : (
                            <User className="size-5 text-primary" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">{user.name}</h1>
                            <span className={`px-2 py-0.5 rounded-md text-xs capitalize ${ROLE_COLORS[user.role] ?? ROLE_COLORS.user}`}>
                                {user.role}
                            </span>
                            {user.isSuspended && <span className="px-2 py-0.5 rounded-md text-xs bg-yellow-500/20 text-yellow-400">Suspended</span>}
                            {user.isDeleted && <span className="px-2 py-0.5 rounded-md text-xs bg-red-500/20 text-red-400">Deleted</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">ID #{user.id}</p>
                    </div>
                </div>
            </div>

            {/* Profile info */}
            <div className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold mb-4">Profile</h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                    {profileFields.map((f) => (
                        <div key={f.label}>
                            <dt className="text-xs text-muted-foreground">{f.label}</dt>
                            <dd className="text-sm mt-0.5 break-all">{f.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            {/* Actions */}
            <UserDetailForm
                user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    isSuspended: user.isSuspended,
                    isDeleted: user.isDeleted,
                    isPremium: user.isPremium,
                    avatarUrl: user.avatarUrl,
                    bio: user.bio,
                    phone: user.phone,
                    linkedinUrl: user.linkedinUrl,
                    createdAt: user.createdAt.toISOString(),
                    totalSessions,
                }}
            />
        </div>
    );
}
