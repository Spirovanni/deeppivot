"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
    { value: "user", label: "User" },
    { value: "mentor", label: "Mentor" },
    { value: "employer", label: "Employer" },
    { value: "wdb_partner", label: "WDB Partner" },
    { value: "enterprise_manager", label: "Enterprise Manager" },
    { value: "admin", label: "Admin" },
] as const;

type RoleValue = (typeof ROLES)[number]["value"];

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    isSuspended: boolean;
    isDeleted: boolean;
    isPremium: boolean;
    avatarUrl: string | null;
    bio: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    createdAt: string;
    totalSessions: number;
}

export function UserDetailForm({ user }: { user: User }) {
    const router = useRouter();
    const [role, setRole] = useState<RoleValue>(user.role as RoleValue);
    const [loading, setLoading] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    async function patch(body: Record<string, unknown>, successMsg: string) {
        setLoading(successMsg);
        setMsg(null);
        const res = await fetch(`/api/admin/users/${user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        setLoading(null);
        if (res.ok) {
            setMsg(successMsg);
            router.refresh();
        } else {
            setMsg("Action failed. Try again.");
        }
    }

    return (
        <div className="space-y-6">
            {msg && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                    {msg}
                </div>
            )}

            {/* Role */}
            <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-3">Role</h3>
                <div className="flex flex-wrap gap-2">
                    {ROLES.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => {
                                setRole(value);
                                patch({ role: value }, `Role updated to '${label}'`);
                            }}
                            disabled={loading !== null}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${role === value
                                    ? "bg-primary text-primary-foreground"
                                    : "border bg-muted hover:bg-muted/80"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Status actions */}
            <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-3">Account Status</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() =>
                            patch(
                                { isSuspended: !user.isSuspended },
                                user.isSuspended ? "User unsuspended" : "User suspended"
                            )
                        }
                        disabled={loading !== null}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${user.isSuspended
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                            }`}
                    >
                        {loading === "User suspended" || loading === "User unsuspended"
                            ? "..."
                            : user.isSuspended
                                ? "Unsuspend User"
                                : "Suspend User"}
                    </button>
                    {!user.isDeleted ? (
                        <button
                            onClick={() => {
                                if (!confirm(`Soft-delete ${user.name}? This is reversible.`)) return;
                                patch({ isDeleted: true }, "User deleted");
                            }}
                            disabled={loading !== null}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                        >
                            Soft Delete
                        </button>
                    ) : (
                        <button
                            onClick={() => patch({ isDeleted: false }, "User restored")}
                            disabled={loading !== null}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        >
                            Restore Account
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
