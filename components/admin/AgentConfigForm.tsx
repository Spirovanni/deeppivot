"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INTERVIEW_TYPES = ["general", "behavioral", "technical", "situational"] as const;

interface AgentFormValues {
    name: string;
    interviewType: string;
    systemPrompt: string;
    voiceId: string;
    elevenLabsAgentId: string;
    isPublic: boolean;
    isDefault: boolean;
}

interface AgentFormProps {
    agentId?: number;
    initialValues?: Partial<AgentFormValues>;
}

export function AgentConfigForm({ agentId, initialValues }: AgentFormProps) {
    const router = useRouter();
    const [form, setForm] = useState<AgentFormValues>({
        name: initialValues?.name ?? "",
        interviewType: initialValues?.interviewType ?? "general",
        systemPrompt: initialValues?.systemPrompt ?? "",
        voiceId: initialValues?.voiceId ?? "",
        elevenLabsAgentId: initialValues?.elevenLabsAgentId ?? "",
        isPublic: initialValues?.isPublic ?? true,
        isDefault: initialValues?.isDefault ?? false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set(key: keyof AgentFormValues, val: unknown) {
        setForm((prev) => ({ ...prev, [key]: val }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const url = agentId ? `/api/admin/agents/${agentId}` : "/api/admin/agents";
            const method = agentId ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error ?? "Failed to save");
            }
            router.push("/admin/agents");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Name *</label>
                    <input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        required
                        placeholder="e.g. Behavioral Coach"
                        className="w-full rounded-lg border bg-muted/40 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Interview Type *</label>
                    <select
                        value={form.interviewType}
                        onChange={(e) => set("interviewType", e.target.value)}
                        className="w-full rounded-lg border bg-muted/40 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize"
                    >
                        {INTERVIEW_TYPES.map((t) => (
                            <option key={t} value={t} className="capitalize">{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">System Prompt *</label>
                <textarea
                    value={form.systemPrompt}
                    onChange={(e) => set("systemPrompt", e.target.value)}
                    required
                    rows={8}
                    placeholder="You are Sarah, an expert behavioral interview coach..."
                    className="w-full rounded-lg border bg-muted/40 px-4 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Voice ID</label>
                    <input
                        value={form.voiceId}
                        onChange={(e) => set("voiceId", e.target.value)}
                        placeholder="ElevenLabs voice ID"
                        className="w-full rounded-lg border bg-muted/40 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Agent ID</label>
                    <input
                        value={form.elevenLabsAgentId}
                        onChange={(e) => set("elevenLabsAgentId", e.target.value)}
                        placeholder="ElevenLabs Conversational AI agent ID"
                        className="w-full rounded-lg border bg-muted/40 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
            </div>

            <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.isPublic}
                        onChange={(e) => set("isPublic", e.target.checked)}
                        className="rounded"
                    />
                    <span className="text-sm">Public (visible to all users)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(e) => set("isDefault", e.target.checked)}
                        className="rounded"
                    />
                    <span className="text-sm">System default</span>
                </label>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => router.push("/admin/agents")}
                    className="px-5 py-2 rounded-lg border bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm font-semibold transition-colors"
                >
                    {loading ? "Saving..." : agentId ? "Update Config" : "Create Config"}
                </button>
            </div>
        </form>
    );
}
