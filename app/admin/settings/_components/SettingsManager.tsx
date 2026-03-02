"use client";

import { useState } from "react";
import { Save, Loader2, Info, AlertTriangle, ShieldCheck } from "lucide-react";
import { updateSystemSetting, SystemSetting } from "@/src/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/src/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
    initialSettings: SystemSetting[];
};

export function SettingsManager({ initialSettings }: Props) {
    const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
    const [saving, setSaving] = useState<string | null>(null);

    const handleToggle = async (key: string, currentValue: string) => {
        const newValue = currentValue === "true" ? "false" : "true";
        setSaving(key);
        try {
            await updateSystemSetting(key, newValue);
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
            toast.success(`Setting "${key}" updated`);
        } catch (error) {
            toast.error("Failed to update setting");
        } finally {
            setSaving(null);
        }
    };

    const handleUpdate = async (key: string, newValue: string) => {
        setSaving(key);
        try {
            await updateSystemSetting(key, newValue);
            setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
            toast.success(`Setting "${key}" updated`);
        } catch (error) {
            toast.error("Failed to update setting");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="grid gap-6">
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <div className="flex items-center gap-2 text-primary">
                        <ShieldCheck className="size-5" />
                        <CardTitle className="text-lg">Dynamic System Controls</CardTitle>
                    </div>
                    <CardDescription>
                        These settings take effect immediately across the entire platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {settings.length === 0 && (
                        <div className="text-center py-12 text-zinc-500 border rounded-xl border-dashed">
                            No dynamic settings found in the database.
                        </div>
                    )}

                    {settings.map((setting) => (
                        <div key={setting.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-background/50 hover:bg-background/80 transition-colors">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    {setting.key}
                                    {setting.key.toLowerCase().includes("maintenance") && (
                                        <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-wider">High Impact</span>
                                    )}
                                </Label>
                                <p className="text-xs text-muted-foreground max-w-md">
                                    {setting.description || "No description provided."}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 self-end md:self-center">
                                {setting.type === "boolean" ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono">{setting.value === "true" ? "ON" : "OFF"}</span>
                                        <Switch
                                            disabled={saving === setting.key}
                                            checked={setting.value === "true"}
                                            onCheckedChange={() => handleToggle(setting.key, setting.value)}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            className="h-8 w-32 font-mono text-xs"
                                            defaultValue={setting.value}
                                            onBlur={(e) => {
                                                if (e.target.value !== setting.value) {
                                                    handleUpdate(setting.key, e.target.value);
                                                }
                                            }}
                                            disabled={saving === setting.key}
                                        />
                                    </div>
                                )}
                                {saving === setting.key && <Loader2 className="size-4 animate-spin text-primary" />}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-600 dark:text-blue-400 flex gap-3">
                <Info className="size-4 shrink-0" />
                <p>
                    <strong>Audit Log:</strong> Every toggle or change is recorded in the <code>system_settings</code> database table with a timestamp and the admin's user ID.
                </p>
            </div>
        </div>
    );
}
