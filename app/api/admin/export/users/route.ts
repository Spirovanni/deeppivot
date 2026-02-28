import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { usersTable, userGamificationTable } from "@/src/db/schema";
import { eq, isNull, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/src/lib/rate-limit";

/** Escape CSV value: wrap in quotes, escape internal quotes */
function csvEscape(val: string | null | undefined): string {
    const s = String(val ?? "");
    return `"${s.replace(/"/g, '""')}"`;
}

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
        const roleFilter = searchParams.get("role")?.trim();
        const includeDeleted = searchParams.get("includeDeleted") === "true";

        const conditions = [];
        if (roleFilter && roleFilter.length > 0) conditions.push(eq(usersTable.role, roleFilter));
        if (!includeDeleted) conditions.push(isNull(usersTable.deletedAt));

        const rows = await db
            .select({
                user: usersTable,
                points: userGamificationTable.points,
                currentStreak: userGamificationTable.currentStreak,
                highestStreak: userGamificationTable.highestStreak,
            })
            .from(usersTable)
            .leftJoin(userGamificationTable, eq(usersTable.id, userGamificationTable.userId))
            .where(conditions.length > 0 ? and(...conditions) : sql`true`);

        const headers = [
            "ID",
            "Clerk ID",
            "First Name",
            "Last Name",
            "Name",
            "Email",
            "Role",
            "Status",
            "Age",
            "Phone",
            "Pronouns",
            "Bio",
            "LinkedIn",
            "Credits",
            "Credits Used",
            "Credits Remaining",
            "Premium",
            "Suspended",
            "Deleted",
            "Deleted At",
            "Points",
            "Current Streak",
            "Highest Streak",
            "WDB Contact ID",
            "WDB Case Plan",
            "WDB Enrolled At",
            "Organization ID",
            "Created At",
            "Updated At",
        ];

        const dataRows = rows.map(({ user: u, points, currentStreak, highestStreak }) => [
            u.id,
            u.clerkId,
            csvEscape(u.firstName),
            csvEscape(u.lastName),
            csvEscape(u.name),
            csvEscape(u.email),
            u.role,
            u.status,
            u.age,
            csvEscape(u.phone),
            csvEscape(u.pronouns),
            csvEscape(u.bio?.slice(0, 500)),
            csvEscape(u.linkedinUrl),
            u.credits,
            u.creditsUsed,
            u.creditsRemaining,
            u.isPremium ? "Yes" : "No",
            u.isSuspended ? "Yes" : "No",
            u.isDeleted ? "Yes" : "No",
            u.deletedAt ? new Date(u.deletedAt).toISOString() : "",
            points ?? 0,
            currentStreak ?? 0,
            highestStreak ?? 0,
            csvEscape(u.wdbSalesforceContactId),
            csvEscape(u.wdbCasePlanId),
            u.wdbEnrolledAt ? new Date(u.wdbEnrolledAt).toISOString() : "",
            csvEscape(u.organizationId),
            new Date(u.createdAt).toISOString(),
            new Date(u.updatedAt).toISOString(),
        ]);

        const csvContent = [headers.join(","), ...dataRows.map((r) => r.join(","))].join("\n");

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
