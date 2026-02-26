"use client";

export function DeleteAgentButton({ agentId, agentName }: { agentId: number; agentName: string }) {
    return (
        <button
            type="button"
            onClick={async () => {
                if (!confirm(`Delete agent config "${agentName}"?`)) return;
                await fetch(`/api/admin/agents/${agentId}`, { method: "DELETE" });
                window.location.reload();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
            Delete
        </button>
    );
}
