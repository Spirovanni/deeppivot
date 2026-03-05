/**
 * POST: Generate a signed CSV download link for job marketplace engagement metrics (deeppivot-314).
 * Admin-only. Body: { from?, to?, status? }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/rbac";
import { createExportToken } from "@/src/lib/export-token";
import { rateLimit } from "@/src/lib/rate-limit";

export async function POST(req: NextRequest) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;

    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const from = typeof body.from === "string" ? body.from.trim() : undefined;
        const to = typeof body.to === "string" ? body.to.trim() : undefined;
        const status = typeof body.status === "string" && ["draft", "published", "closed"].includes(body.status)
            ? (body.status as "draft" | "published" | "closed")
            : undefined;

        const token = createExportToken({
            type: "job_marketplace_engagement",
            from: from && from.length > 0 ? from : undefined,
            to: to && to.length > 0 ? to : undefined,
            status,
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const url = `${baseUrl}/api/admin/export/download?token=${encodeURIComponent(token)}`;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        return NextResponse.json({ url, expiresAt });
    } catch (error) {
        if (error instanceof Error && error.message.includes("EXPORT_SIGNING_SECRET")) {
            return NextResponse.json(
                { error: "Export signing secret not configured. Set EXPORT_SIGNING_SECRET in .env" },
                { status: 503 }
            );
        }
        console.error("Failed to generate jobs engagement export link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
