"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
    { value: "user", label: "User" },
    { value: "mentor", label: "Mentor" },
    { value: "employer", label: "Employer" },
    { value: "wdb_partner", label: "WDB Partner" },
    { value: "enterprise_manager", label: "Enterprise Mgr" },
    { value: "admin", label: "Admin" },
] as const;

type RoleValue = (typeof ROLES)[number]["value"];

const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    employer: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    user: "bg-white/10 text-white/60 border-white/20",
    enterprise_manager: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    mentor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    wdb_partner: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

interface Props {
    userId: number;
    currentRole: string;
}

export function QuickRoleSelect({ userId, currentRole }: Props) {
    const router = useRouter();
    const [role, setRole] = useState<RoleValue>(currentRole as RoleValue);
    const [saving, setSaving] = useState(false);

    async function handleChange(newRole: RoleValue) {
        if (newRole === role) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                setRole(newRole);
                router.refresh();
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-xs border capitalize ${ROLE_COLORS[role] ?? ROLE_COLORS.user}`}>
                {ROLES.find((r) => r.value === role)?.label ?? role}
            </span>
            <select
                value={role}
                disabled={saving}
                onChange={(e) => handleChange(e.target.value as RoleValue)}
                className="h-6 rounded border border-white/10 bg-muted/60 px-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 cursor-pointer"
                aria-label="Change role"
            >
                {ROLES.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
            {saving && <span className="text-xs text-muted-foreground animate-pulse">Saving…</span>}
        </div>
    );
}
