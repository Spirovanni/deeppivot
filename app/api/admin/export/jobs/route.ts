import { requireAdmin } from "@/src/lib/rbac";
import { generateJobMarketplaceEngagementCsv } from "@/src/lib/admin-export";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/src/lib/rate-limit";

/** GET: Admin CSV export for job marketplace engagement metrics (deeppivot-314). Query: from, to (ISO dates), status (draft|published|closed). */
export async function GET(req: NextRequest) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;

    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from")?.trim();
        const to = searchParams.get("to")?.trim();
        const status = searchParams.get("status")?.trim() as "draft" | "published" | "closed" | undefined;

        const csvContent = await generateJobMarketplaceEngagementCsv({
            from: from && from.length > 0 ? from : undefined,
            to: to && to.length > 0 ? to : undefined,
            status: status && ["draft", "published", "closed"].includes(status) ? status : undefined,
        });

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="deeppivot-jobs-engagement-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Failed to export jobs engagement CSV:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
