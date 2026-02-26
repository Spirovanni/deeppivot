import { requireAdmin } from "@/src/lib/rbac";
import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";
import { AgentConfigForm } from "@/components/admin/AgentConfigForm";

export default async function NewAgentConfigPage() {
    await requireAdmin();

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <Link href="/admin/agents" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-4" />
                </Link>
                <div className="flex items-center gap-2">
                    <Bot className="size-5 text-violet-400" />
                    <h1 className="text-xl font-bold">New Agent Config</h1>
                </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
                <AgentConfigForm />
            </div>
        </div>
    );
}
