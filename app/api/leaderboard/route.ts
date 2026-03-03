import { db } from "@/src/db";
import { usersTable, userGamificationTable } from "@/src/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const clerkUser = await currentUser();
        // Optional: We could check if the user is authenticated, but leaderboards are often public-ish.
        // However, the task implies a dashboard feature, so let's keep it consistent with other API gates.
        if (!clerkUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const topUsers = await db
            .select({
                id: usersTable.id,
                name: usersTable.name,
                avatarUrl: usersTable.avatarUrl,
                points: userGamificationTable.points,
                currentStreak: userGamificationTable.currentStreak,
            })
            .from(userGamificationTable)
            .innerJoin(usersTable, eq(userGamificationTable.userId, usersTable.id))
            .where(and(eq(userGamificationTable.isPublic, true), eq(usersTable.isDeleted, false)))
            .orderBy(desc(userGamificationTable.points))
            .limit(50);

        return NextResponse.json({
            leaderboard: topUsers,
        });
    } catch (error) {
        console.error("[LEADERBOARD_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
