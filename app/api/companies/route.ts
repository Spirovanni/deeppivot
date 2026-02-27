import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { companiesTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";

/** GET /api/companies — list all companies (public) */
export async function GET() {
    try {
        const companies = await db
            .select()
            .from(companiesTable)
            .orderBy(companiesTable.createdAt);
        return NextResponse.json(companies);
    } catch {
        return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }
}

/** POST /api/companies — create a company (employer only) */
export async function POST(req: NextRequest) {
    const rl = await rateLimit(req, "DEFAULT");
    if (!rl.success) return rl.response;

    try {
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

        if (!name?.trim())
            return NextResponse.json({ error: "Company name is required" }, { status: 400 });

        const [company] = await db
            .insert(companiesTable)
            .values({
                ownerUserId: dbUser.id,
                name: name.trim(),
                logoUrl: logoUrl ?? null,
                website: website ?? null,
                description: description ?? null,
                size: size ?? null,
                industry: industry ?? null,
                location: location ?? null,
            })
            .returning();

        return NextResponse.json(company, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
    }
}
