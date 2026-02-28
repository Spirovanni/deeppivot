import { requireSystemAdmin } from "@/src/lib/rbac";
import { Settings, ShieldAlert } from "lucide-react";

export const metadata = {
    title: "System Settings | Admin",
};

export default async function AdminSettingsPage() {
    // We restrict this page to system_admins ONLY due to the sensitive nature of viewing env vars
    await requireSystemAdmin();

    const envVars = Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b));

    // Mask sensitive variables
    const sensitiveKeywords = ["SECRET", "PASSWORD", "KEY", "TOKEN", "URL", "STRIPE", "DB", "NEON", "CLERK"];

    const maskedEnvVars = envVars.map(([key, value]) => {
        const isSensitive = sensitiveKeywords.some((keyword) => key.toUpperCase().includes(keyword));
        if (isSensitive && value) {
            // Show only first 4 and last 4 chars, mask the rest
            const valStr = String(value);
            if (valStr.length > 8) {
                return [key, `${valStr.slice(0, 4)}••••••••${valStr.slice(-4)}`];
            } else {
                return [key, "••••••••"];
            }
        }
        return [key, value];
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="size-5 text-zinc-500" />
                    <h1 className="text-xl font-bold">System Settings</h1>
                </div>
            </div>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-600 dark:text-yellow-400 flex gap-3 mb-6">
                <ShieldAlert className="size-5 shrink-0" />
                <p>
                    <strong>System Administrator View Only:</strong> Environment variables are displayed below for debugging purposes.
                    Tokens, passwords, and connection strings are automatically masked.
                </p>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/30">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-1/3">Key</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {maskedEnvVars.map(([key, value]) => (
                            <tr key={key} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs">{key}</td>
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground break-all">
                                    {value || <span className="text-muted-foreground/50 italic">empty</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
