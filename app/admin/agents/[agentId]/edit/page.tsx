import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { agentConfigsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";
import { AgentConfigForm } from "@/components/admin/AgentConfigForm";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ agentId: string }>;
}

export default async function EditAgentConfigPage({ params }: Props) {
    await requireAdmin();
    const { agentId } = await params;
    const id = parseInt(agentId);
    if (isNaN(id)) notFound();

    const [config] = await db.select().from(agentConfigsTable).where(eq(agentConfigsTable.id, id));
    if (!config) notFound();

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <Link href="/admin/agents" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-4" />
                </Link>
                <div className="flex items-center gap-2">
                    <Bot className="size-5 text-violet-400" />
                    <div>
                        <h1 className="text-xl font-bold">Edit Agent Config</h1>
                        <p className="text-xs text-muted-foreground">ID #{config.id}</p>
                    </div>
                </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
                <AgentConfigForm
                    agentId={config.id}
                    initialValues={{
                        name: config.name,
                        interviewType: config.interviewType,
                        systemPrompt: config.systemPrompt,
                        voiceId: config.voiceId ?? "",
                        elevenLabsAgentId: config.elevenLabsAgentId ?? "",
                        isPublic: config.isPublic,
                        isDefault: config.isDefault,
                    }}
                />
            </div>
        </div>
    );
}
