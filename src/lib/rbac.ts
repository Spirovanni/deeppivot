/**
 * Role-Based Access Control (RBAC) utilities
 *
 * Roles stored in `users.role` (varchar):
 *   "user"        – default authenticated user (learner)
 *   "mentor"      – approved career coach / mentor
 *   "wdb_partner" – Workforce Development Board partner
 *   "admin"       – platform administrator
 *
 * Usage in Server Components / Server Actions:
 *   const role = await getCurrentUserRole();
 *   if (!hasRole(role, "mentor")) redirect("/unauthorized");
 */

import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type UserRole = "user" | "mentor" | "wdb_partner" | "admin";

/**
 * Fetch the current user's role from the DB.
 * Returns null if the user is not authenticated or not in the DB.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) return null;

  const [row] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUser.id))
    .limit(1);

  return (row?.role as UserRole) ?? null;
}

/**
 * Check whether a role satisfies the required role.
 * Admins implicitly satisfy any role requirement.
 */
export function hasRole(
  userRole: UserRole | null | undefined,
  required: UserRole
): boolean {
  if (!userRole) return false;
  if (userRole === "admin") return true;
  return userRole === required;
}

/**
 * Server Component guard: redirects to /unauthorized if the user
 * doesn't hold the required role.
 *
 * @example
 * // In a server component:
 * await requireRole("mentor");
 */
export async function requireRole(required: UserRole): Promise<void> {
  const role = await getCurrentUserRole();
  if (!hasRole(role, required)) {
    redirect("/unauthorized");
  }
}

// ─── Admin helpers (backward compat) ─────────────────────────────────────────

export interface AuthorizedUser {
  clerkId: string;
  /** DB primary key — also aliased as `id` for backward compatibility */
  dbId: number;
  /** Alias for dbId (backward compat) */
  id: number;
  role: UserRole;
}

/**
 * Require admin role, returning the current user record.
 * Redirects to /unauthorized if the user is not an admin.
 */
export async function requireAdmin(): Promise<AuthorizedUser> {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) redirect("/sign-in");

  const [row] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUser.id))
    .limit(1);

  if (!row || row.role !== "admin") {
    redirect("/unauthorized");
  }

  return { clerkId: clerkUser.id, dbId: row.id, id: row.id, role: row.role as UserRole };
}
