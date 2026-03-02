import { requireSystemAdmin } from "@/src/lib/rbac";
import { Settings, ShieldAlert, Cpu, Terminal } from "lucide-react";
import { getSystemSettings } from "@/src/lib/actions/settings";
import { SettingsManager } from "./_components/SettingsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { db } from "@/src/db";
import { systemSettingsTable } from "@/src/db/schema";

export const metadata = {
    title: "System Management | Admin",
};

export default async function AdminSettingsPage() {
    // We restrict this page to system_admins ONLY
    await requireSystemAdmin();

    let dynamicSettings = await getSystemSettings();

    // Seed defaults if empty
    if (dynamicSettings.length === 0) {
        await db.insert(systemSettingsTable).values([
            { key: "MAINTENANCE_MODE", value: "false", type: "boolean", description: "When enabled, visitors are shown a maintenance page." },
            { key: "ALLOW_PUBLIC_REGISTRATION", value: "true", type: "boolean", description: "Whether new users can sign up without an invite." },
            { key: "MAX_DAILY_CREDITS_LEARNER", value: "10", type: "number", description: "Maximum daily usage credits for free-tier learners." },
            { key: "PRIMARY_AI_MODEL", value: "gpt-4o", type: "string", description: "The default LLM model used for career coaching." },
        ]);
        dynamicSettings = await getSystemSettings();
    }

    const envVarsRaw = Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b));

    // Mask sensitive variables
    const sensitiveKeywords = ["SECRET", "PASSWORD", "KEY", "TOKEN", "URL", "STRIPE", "DB", "NEON", "CLERK"];
    const maskedEnvVars = envVarsRaw.map(([key, value]) => {
        const isSensitive = sensitiveKeywords.some((keyword) => key.toUpperCase().includes(keyword));
        if (isSensitive && value) {
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
                    <h1 className="text-xl font-bold">System Management</h1>
                </div>
            </div>

            <Tabs defaultValue="dynamic" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="dynamic" className="gap-2">
                        <Cpu className="size-4" />
                        Dynamic Settings
                    </TabsTrigger>
                    <TabsTrigger value="env" className="gap-2">
                        <Terminal className="size-4" />
                        System Environment
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dynamic">
                    <SettingsManager initialSettings={dynamicSettings} />
                </TabsContent>

                <TabsContent value="env">
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-xs text-yellow-600 dark:text-yellow-400 flex gap-3 mb-6">
                        <ShieldAlert className="size-4 shrink-0" />
                        <p>
                            <strong>Read-Only View:</strong> Environment variables are static and defined in <code>.env</code> or the deployment platform.
                            They cannot be changed here.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card overflow-hidden">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-1/3">Key</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maskedEnvVars.map(([key, value]) => (
                                    <tr key={key} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-2 font-mono">{key}</td>
                                        <td className="px-4 py-2 font-mono text-muted-foreground break-all">
                                            {value || <span className="text-muted-foreground/30 italic">empty</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
