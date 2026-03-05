/**
 * GET: Download CSV via signed token (deeppivot-313, deeppivot-312).
 * No session required — token must be valid and not expired.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyExportToken } from "@/src/lib/export-token";
import { generateUsersCsv, generateInterviewSessionsCsv, generateJobMarketplaceEngagementCsv } from "@/src/lib/admin-export";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");
        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
        }

        const payload = verifyExportToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid or expired download link" }, { status: 403 });
        }

        let csvContent: string;
        let filename: string;

        if (payload.type === "users") {
            csvContent = await generateUsersCsv({
                role: payload.role,
                includeDeleted: payload.includeDeleted ?? false,
            });
            filename = `deeppivot-users-${new Date().toISOString().split("T")[0]}.csv`;
        } else if (payload.type === "interview_sessions") {
            csvContent = await generateInterviewSessionsCsv({
                from: payload.from,
                to: payload.to,
                includeDeleted: payload.includeDeleted ?? false,
            });
            filename = `deeppivot-sessions-${new Date().toISOString().split("T")[0]}.csv`;
        } else if (payload.type === "job_marketplace_engagement") {
            csvContent = await generateJobMarketplaceEngagementCsv({
                from: payload.from,
                to: payload.to,
                status: payload.status,
            });
            filename = `deeppivot-jobs-engagement-${new Date().toISOString().split("T")[0]}.csv`;
        } else {
            return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
        }

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Failed to download export:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
