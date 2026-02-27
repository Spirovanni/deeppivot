import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { companiesTable, usersTable } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";

/** GET /api/companies/[id] — public company detail */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [company] = await db
            .select()
            .from(companiesTable)
            .where(eq(companiesTable.id, parseInt(id)))
            .limit(1);

        if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(company);
    } catch {
        return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
    }
}

/** PATCH /api/companies/[id] — employer-only edit (ownership check) */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const rl = await rateLimit(req, "DEFAULT");
    if (!rl.success) return rl.response;

    try {
        const { id } = await params;
        const clerkUser = await currentUser();
        if (!clerkUser?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [dbUser] = await db
            .select({ id: usersTable.id, role: usersTable.role })
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkUser.id))
            .limit(1);

        if (!dbUser || (dbUser.role !== "employer" && dbUser.role !== "admin"))
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const { name, logoUrl, website, description, size, industry, location } = body;

        const whereClause =
            dbUser.role === "admin"
                ? eq(companiesTable.id, parseInt(id))
                : and(
                    eq(companiesTable.id, parseInt(id)),
                    eq(companiesTable.ownerUserId, dbUser.id)
                );

        const [updated] = await db
            .update(companiesTable)
            .set({
                ...(name !== undefined && { name: name.trim() }),
                ...(logoUrl !== undefined && { logoUrl }),
                ...(website !== undefined && { website }),
                ...(description !== undefined && { description }),
                ...(size !== undefined && { size }),
                ...(industry !== undefined && { industry }),
                ...(location !== undefined && { location }),
                updatedAt: new Date(),
            })
            .where(whereClause!)
            .returning();

        if (!updated) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
    }
}
