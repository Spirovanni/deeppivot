import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { interviewSessionsTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/src/lib/rate-limit";

export async function GET(req: NextRequest) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;

    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const sessions = await db
            .select({
                session: interviewSessionsTable,
                user: { email: usersTable.email, name: usersTable.name },
            })
            .from(interviewSessionsTable)
            .leftJoin(usersTable, eq(interviewSessionsTable.userId, usersTable.id));

        const headers = [
            "Session ID",
            "User ID",
            "User Name",
            "User Email",
            "Session Type",
            "Status",
            "Started At",
            "Ended At",
            "Overall Score",
        ];

        const rows = sessions.map(({ session: s, user: u }) => [
            s.id,
            s.userId,
            `"${(u?.name ?? "").replace(/"/g, '""')}"`,
            u?.email ?? "",
            s.sessionType,
            s.status,
            s.startedAt ? new Date(s.startedAt).toISOString() : "",
            s.endedAt ? new Date(s.endedAt).toISOString() : "",
            s.overallScore ?? "",
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

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
