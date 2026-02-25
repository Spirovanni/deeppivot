/**
 * Admin authentication helper.
 * Re-exports from the central RBAC module for backward compatibility.
 */

export type { AuthorizedUser as AdminUser } from "./rbac";
export { requireAdmin } from "./rbac";
