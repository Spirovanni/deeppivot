import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { agentConfigsTable, usersTable } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Bot, Plus, Pencil } from "lucide-react";
import { DeleteAgentButton } from "@/components/admin/DeleteAgentButton";

const TYPE_COLORS: Record<string, string> = {
    behavioral: "bg-blue-500/20 text-blue-400",
    technical: "bg-orange-500/20 text-orange-400",
    situational: "bg-green-500/20 text-green-400",
    general: "bg-white/10 text-white/60",
};

export default async function AdminAgentsPage() {
    await requireAdmin();

    const configs = await db
        .select({
            id: agentConfigsTable.id,
            name: agentConfigsTable.name,
            interviewType: agentConfigsTable.interviewType,
            isPublic: agentConfigsTable.isPublic,
            isDefault: agentConfigsTable.isDefault,
            createdAt: agentConfigsTable.createdAt,
            ownerName: usersTable.name,
        })
        .from(agentConfigsTable)
        .leftJoin(usersTable, eq(agentConfigsTable.userId, usersTable.id))
        .orderBy(desc(agentConfigsTable.createdAt));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="size-5 text-violet-400" />
                    <h1 className="text-xl font-bold">Agent Configs</h1>
                    <span className="text-sm text-muted-foreground">({configs.length})</span>
                </div>
                <Link
                    href="/admin/agents/new"
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="size-4" />
                    New Config
                </Link>
            </div>

            <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/30">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Flags</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs.map((c) => (
                            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 font-medium">{c.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-md text-xs capitalize ${TYPE_COLORS[c.interviewType] ?? TYPE_COLORS.general}`}>
                                        {c.interviewType}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {c.ownerName ?? "System"}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                        {c.isPublic && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">Public</span>
                                        )}
                                        {c.isDefault && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Default</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/agents/${c.id}/edit`}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
                                        >
                                            <Pencil className="size-3" />
                                            Edit
                                        </Link>
                                        <DeleteAgentButton agentId={c.id} agentName={c.name} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {configs.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground text-sm">No agent configs yet.</div>
                )}
            </div>
        </div>
    );
}
