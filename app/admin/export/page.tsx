import { requireAdmin } from "@/src/lib/admin-auth";
import { Download, Users, Activity, Briefcase } from "lucide-react";
import { ExportUsersButtons } from "@/components/admin/ExportUsersButtons";
import { ExportSessionsButtons } from "@/components/admin/ExportSessionsButtons";
import { ExportJobEngagementButtons } from "@/components/admin/ExportJobEngagementButtons";

export default async function AdminExportPage() {
    await requireAdmin();

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Download className="size-5 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Data Exports</h1>
                </div>
                <p className="text-muted-foreground text-sm">
                    Download CSV exports of users and interview sessions.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-blue-500/10">
                            <Users className="size-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Users CSV</h2>
                            <p className="text-xs text-muted-foreground">Export users with optional role filter</p>
                        </div>
                    </div>
                    <ExportUsersButtons />
                </div>

                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-pink-500/10">
                            <Activity className="size-5 text-pink-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Interview Sessions CSV</h2>
                            <p className="text-xs text-muted-foreground">Export sessions with optional date range</p>
                        </div>
                    </div>
                    <ExportSessionsButtons />
                </div>

                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-orange-500/10">
                            <Briefcase className="size-5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Job Marketplace Engagement CSV</h2>
                            <p className="text-xs text-muted-foreground">Per-job metrics: applications, matches, invitations</p>
                        </div>
                    </div>
                    <ExportJobEngagementButtons />
                </div>
            </div>
        </div>
    );
}
