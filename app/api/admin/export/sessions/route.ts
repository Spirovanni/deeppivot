import { requireAdmin } from "@/src/lib/rbac";
import { generateInterviewSessionsCsv } from "@/src/lib/admin-export";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/src/lib/rate-limit";

/** GET: Admin CSV export for interview sessions (deeppivot-312). Query: from, to (ISO dates), includeDeleted. */
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
        const includeDeleted = searchParams.get("includeDeleted") === "true";

        const csvContent = await generateInterviewSessionsCsv({
            from: from && from.length > 0 ? from : undefined,
            to: to && to.length > 0 ? to : undefined,
            includeDeleted,
        });

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="deeppivot-sessions-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Failed to export sessions CSV:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
