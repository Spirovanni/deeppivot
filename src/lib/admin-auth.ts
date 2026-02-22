/**
 * Admin authentication helper.
 * Ensures the current user has the 'admin' role before allowing access.
 */

import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export interface AdminUser {
  id: number;
  clerkId: string;
  email: string;
  role: string;
}

/**
 * Returns the current user's DB record if they have the admin role.
 * Throws if unauthenticated or not an admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      clerkId: usersTable.clerkId,
      email: usersTable.email,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  if (!user || user.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }

  return user as AdminUser;
}
