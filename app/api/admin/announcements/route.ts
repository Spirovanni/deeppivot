/**
 * Admin announcements broadcast API — Phase 16.3 (deeppivot-240, deeppivot-253)
 *
 * POST: Create announcement, insert into admin_announcements, and create in-app notifications for all users.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/rbac";
import { db } from "@/src/db";
import { adminAnnouncementsTable, usersTable, notificationsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    let adminUser;
    try {
        adminUser = await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const { title, body: content, sendToHome } = body;
        if (!title || typeof title !== "string" || !title.trim()) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const bodyText = (typeof content === "string" ? content : "").trim() || title.trim();
        const sendToHomeBool = Boolean(sendToHome);

        const [announcement] = await db
            .insert(adminAnnouncementsTable)
            .values({
                title: title.trim(),
                body: bodyText,
                sendToHome: sendToHomeBool,
                createdBy: adminUser.id,
            })
            .returning();

        if (!announcement) {
            return NextResponse.json(
                { error: "Failed to create announcement" },
                { status: 500 }
            );
        }

        // Create in-app notification for each user (broadcast) via Inngest fan-out (deeppivot-256)
        const { inngest } = await import("@/src/inngest/client");
        await inngest.send({
            name: "admin/announcement.created",
            data: {
                announcementId: announcement.id,
                title: title.trim(),
                body: bodyText,
                sendToHome: sendToHomeBool,
            },
        });

        const sendToHomeNote = sendToHomeBool ? " (Send to Home: users will be redirected to announcement on dashboard)" : "";
        return NextResponse.json({
            success: true,
            id: announcement.id,
            message: `Background broadcast started.${sendToHomeNote}`,
        });
    } catch (err) {
        console.error("[admin/announcements] POST failed:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
