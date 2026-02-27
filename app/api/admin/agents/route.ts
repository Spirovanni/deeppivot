import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { agentConfigsTable } from "@/src/db/schema";
import { rateLimit } from "@/src/lib/rate-limit";

export async function GET() {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await db.select().from(agentConfigsTable).orderBy(agentConfigsTable.createdAt);
    return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;

    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, interviewType, systemPrompt, voiceId, elevenLabsAgentId, isPublic, isDefault, userId } = body;

    if (!name || !systemPrompt || !interviewType) {
        return NextResponse.json({ error: "name, systemPrompt, and interviewType are required" }, { status: 400 });
    }

    const [created] = await db
        .insert(agentConfigsTable)
        .values({
            name,
            interviewType,
            systemPrompt,
            voiceId: voiceId || null,
            elevenLabsAgentId: elevenLabsAgentId || null,
            isPublic: Boolean(isPublic),
            isDefault: Boolean(isDefault),
            userId: userId ? parseInt(userId) : null,
        })
        .returning();

    return NextResponse.json(created, { status: 201 });
}
