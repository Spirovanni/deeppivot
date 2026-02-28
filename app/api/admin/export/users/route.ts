import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
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
        const users = await db.select().from(usersTable);

        // Define CSV headers
        const headers = [
            "ID",
            "Clerk ID",
            "Name",
            "Email",
            "Role",
            "Status",
            "Premium",
            "Suspended",
            "Deleted",
            "Phone",
            "LinkedIn",
            "Joined At",
        ];

        // Format rows
        const rows = users.map((u) => [
            u.id,
            u.clerkId,
            `"${(u.name ?? "").replace(/"/g, '""')}"`, // escape quotes and wrap in quotes
            u.email,
            u.role,
            u.status,
            u.isPremium ? "Yes" : "No",
            u.isSuspended ? "Yes" : "No",
            u.isDeleted ? "Yes" : "No",
            `"${(u.phone ?? "").replace(/"/g, '""')}"`,
            `"${(u.linkedinUrl ?? "").replace(/"/g, '""')}"`,
            new Date(u.createdAt).toISOString(),
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="deeppivot-users-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Failed to export users CSV:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
