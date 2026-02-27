import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { agentConfigsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";

type Params = { params: Promise<{ agentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
    const { agentId } = await params;
    const id = parseInt(agentId);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });

    const [config] = await db.select().from(agentConfigsTable).where(eq(agentConfigsTable.id, id));
    if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(config);
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;
    try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
    const { agentId } = await params;
    const id = parseInt(agentId);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });

    const body = await req.json();
    const allowed = ["name", "interviewType", "systemPrompt", "voiceId", "elevenLabsAgentId", "isPublic", "isDefault", "userId"] as const;
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
        if (key in body) patch[key] = body[key];
    }

    const [updated] = await db
        .update(agentConfigsTable)
        .set(patch)
        .where(eq(agentConfigsTable.id, id))
        .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;
    try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
    const { agentId } = await params;
    const id = parseInt(agentId);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid agentId" }, { status: 400 });

    await db.delete(agentConfigsTable).where(eq(agentConfigsTable.id, id));
    return new NextResponse(null, { status: 204 });
}
