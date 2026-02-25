/**
 * Role-Based Access Control (RBAC) helpers.
 *
 * Roles (stored in usersTable.role):
 *   "admin"    — DeepPivot team; full access including /admin routes
 *   "employer" — Recruiter/company; access to /employer routes
 *   "user"     — Default learner/job-seeker; access to /dashboard routes
 *
 * Usage (Server Components / Server Actions / API routes):
 *   const user = await requireRole("admin");
 *   const user = await requireRole(["admin", "employer"]);
 *   const user = await requireAdmin();
 *   const user = await requireEmployer();
 *   const user = await requireLearner();
 */

import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppRole = "admin" | "employer" | "user";

export interface AuthorizedUser {
  id: number;
  clerkId: string;
  email: string;
  role: AppRole;
  isSuspended: boolean;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

/**
 * Resolves the current Clerk session to a DB user and enforces the given
 * role requirement. Throws with a descriptive message on failure so callers
 * can decide whether to redirect or return a 403.
 *
 * @param required  A single role string or an array of acceptable roles.
 */
export async function requireRole(
  required: AppRole | AppRole[]
): Promise<AuthorizedUser> {
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
      isSuspended: usersTable.isSuspended,
      isActive: usersTable.isActive,
    })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found in database");
  }

  if (user.isSuspended || !user.isActive) {
    throw new Error("Account suspended or inactive");
  }

  const allowedRoles = Array.isArray(required) ? required : [required];
  if (!allowedRoles.includes(user.role as AppRole)) {
    throw new Error(
      `Forbidden: requires role ${allowedRoles.join(" or ")}, got ${user.role}`
    );
  }

  return user as AuthorizedUser;
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

/** Requires the "admin" role. Throws otherwise. */
export async function requireAdmin(): Promise<AuthorizedUser> {
  return requireRole("admin");
}

/** Requires the "employer" role. Throws otherwise. */
export async function requireEmployer(): Promise<AuthorizedUser> {
  return requireRole("employer");
}

/**
 * Requires either "admin" or "employer" (for routes accessible to both).
 */
export async function requireEmployerOrAdmin(): Promise<AuthorizedUser> {
  return requireRole(["admin", "employer"]);
}

/**
 * Requires any authenticated, active user ("user", "employer", or "admin").
 * Use this for routes that are open to all authenticated learners/staff.
 */
export async function requireLearner(): Promise<AuthorizedUser> {
  return requireRole(["user", "employer", "admin"]);
}

// ---------------------------------------------------------------------------
// Utility: get current user without throwing
// ---------------------------------------------------------------------------

/**
 * Returns the current user's DB record (with role) or null if unauthenticated
 * / not found. Never throws. Useful for conditional UI rendering in layouts.
 */
export async function getCurrentUser(): Promise<AuthorizedUser | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const [user] = await db
      .select({
        id: usersTable.id,
        clerkId: usersTable.clerkId,
        email: usersTable.email,
        role: usersTable.role,
        isSuspended: usersTable.isSuspended,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    return user ? (user as AuthorizedUser) : null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the user's role satisfies the requirement. Never throws.
 */
export function hasRole(
  user: AuthorizedUser | null,
  required: AppRole | AppRole[]
): boolean {
  if (!user) return false;
  const allowed = Array.isArray(required) ? required : [required];
  return allowed.includes(user.role);
}
