/**
 * GET: Download CSV via signed token (deeppivot-313).
 * No session required — token must be valid and not expired.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyExportToken } from "@/src/lib/export-token";
import { generateUsersCsv } from "@/src/lib/admin-export";

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

        if (payload.type !== "users") {
            return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
        }

        const csvContent = await generateUsersCsv({
            role: payload.role,
            includeDeleted: payload.includeDeleted ?? false,
        });

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="deeppivot-users-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Failed to download export:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
