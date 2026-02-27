/**
 * Role-Based Access Control (RBAC) utilities
 *
 * Roles stored in `users.role` (varchar):
 *   "user"               – default authenticated user (learner)
 *   "mentor"             – approved career coach / mentor
 *   "wdb_partner"        – Workforce Development Board partner
 *   "enterprise_manager" – Enterprise Talent Manager (read-only cohort access)
 *   "admin"              – platform administrator (implicit access to all roles)
 *
 * Permissions by role:
 *   user               → own data only
 *   mentor             → own learner cohort + mentor tools
 *   wdb_partner        → WDB-specific analytics + learner referral visibility
 *   enterprise_manager → read-only access to their org's cohort of users;
 *                        no access to other orgs' data or admin functions
 *   admin              → full access (satisfies any role check)
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

export type UserRole =
  | "user"
  | "mentor"
  | "wdb_partner"
  | "enterprise_manager"
  | "employer"
  | "admin";

// ─── Enterprise Manager permissions ──────────────────────────────────────────

/**
 * Permissions that an enterprise_manager holds.
 * Keep in sync with any middleware or API-level checks.
 */
export const ENTERPRISE_MANAGER_PERMISSIONS = [
  "cohort:read",          // view learners in their own org cohort
  "cohort:export",        // export cohort learner data (CSV/PDF)
  "sessions:read",        // view interview session summaries for their cohort
  "insights:read",        // view aggregated analytics for their cohort
] as const;

export type EnterprisePermission = (typeof ENTERPRISE_MANAGER_PERMISSIONS)[number];

/**
 * Check whether a given role grants a specific enterprise permission.
 * Admins always have all permissions.
 */
export function hasEnterprisePermission(
  role: UserRole | null | undefined,
  permission: EnterprisePermission
): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (role === "enterprise_manager") {
    return (ENTERPRISE_MANAGER_PERMISSIONS as readonly string[]).includes(permission);
  }
  return false;
}

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

// ─── Enterprise manager helpers ───────────────────────────────────────────────

export interface EnterpriseManagerUser {
  clerkId: string;
  dbId: number;
  /** Organization ID stored in the user's Clerk public metadata */
  orgId: string | null;
  role: UserRole;
}

/**
 * Require the enterprise_manager (or admin) role.
 * Returns the authenticated user with their orgId for scoped data access.
 */
export async function requireEnterpriseManager(): Promise<EnterpriseManagerUser> {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) redirect("/sign-in");

  const [row] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUser.id))
    .limit(1);

  if (!row || (row.role !== "enterprise_manager" && row.role !== "admin")) {
    redirect("/unauthorized");
  }

  // Org ID is stored in Clerk's publicMetadata.orgId (set during provisioning)
  const orgId =
    (clerkUser.publicMetadata?.orgId as string | undefined) ?? null;

  return {
    clerkId: clerkUser.id,
    dbId: row.id,
    orgId,
    role: row.role as UserRole,
  };
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

// ─── Employer helpers ─────────────────────────────────────────────────────────

/**
 * Require the employer (or admin) role.
 * Returns the authenticated user record.
 */
export async function requireEmployer(): Promise<AuthorizedUser> {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) redirect("/sign-in");

  const [row] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUser.id))
    .limit(1);

  if (!row || (row.role !== "employer" && row.role !== "admin")) {
    redirect("/unauthorized");
  }

  return { clerkId: clerkUser.id, dbId: row.id, id: row.id, role: row.role as UserRole };
}

/**
 * Check whether a role is an employer or admin (used for non-redirect guards).
 */
export function isEmployerOrAdmin(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === "employer" || role === "admin";
}

// ─── Dashboard routing ────────────────────────────────────────────────────────

/**
 * Maps a user role to their dedicated dashboard route.
 * Used for post-login and post-onboarding redirects.
 *
 * @example
 * const route = getUserDashboardRoute("employer"); // "/dashboard/talent-scout"
 */
export function getUserDashboardRoute(role: UserRole | null | undefined): string {
  switch (role) {
    case "employer":
      return "/dashboard/talent-scout";
    case "mentor":
      return "/dashboard/mentor";
    case "wdb_partner":
      return "/dashboard/wdb";
    case "enterprise_manager":
      return "/dashboard/wdb";
    case "admin":
      return "/admin";
    default:
      return "/dashboard/trailblazer";
  }
}
