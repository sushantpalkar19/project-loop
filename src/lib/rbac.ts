/**
 * Project LOOP — Role-Based Access Control
 *
 * Central definition of role groups for API routes and UI permission checks.
 * Server routes must still call requireRole() — never rely on UI alone.
 */

import type { Role } from "@/lib/permissions";

export const ROLE_GROUPS = {
  feedbackRead: ["ADMIN", "MANAGER", "ANALYST", "VIEWER"] satisfies Role[],
  feedbackWrite: ["ADMIN", "MANAGER", "ANALYST"] satisfies Role[],
  analyticsRead: ["ADMIN", "MANAGER", "ANALYST", "VIEWER"] satisfies Role[],
  ask: ["ADMIN", "MANAGER", "ANALYST", "VIEWER"] satisfies Role[],
  reportsRead: ["ADMIN", "MANAGER", "ANALYST", "VIEWER"] satisfies Role[],
  reportsWrite: ["ADMIN", "MANAGER", "ANALYST"] satisfies Role[],
  themesRead: ["ADMIN", "MANAGER", "ANALYST", "VIEWER"] satisfies Role[],
  membersRead: ["ADMIN", "MANAGER"] satisfies Role[],
  membersWrite: ["ADMIN", "MANAGER"] satisfies Role[],
  adminLogs: ["ADMIN"] satisfies Role[],
} as const;

/** Roles that can create, import, simulate, update, and delete feedback */
export function canManageFeedback(role: string | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "ANALYST";
}

export function canGenerateReports(role: string | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER" || role === "ANALYST";
}

/** Roles that can view feedback and analytics (read-only inbox) */
export function canViewFeedback(role: string | undefined): boolean {
  return (
    role === "ADMIN" ||
    role === "MANAGER" ||
    role === "ANALYST" ||
    role === "VIEWER"
  );
}

export function canManageTeam(role: string | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function canViewAdminLogs(role: string | undefined): boolean {
  return role === "ADMIN";
}

/** Main app navigation visible to role */
export function canAccessMainPlatform(role: string | undefined): boolean {
  return canViewFeedback(role);
}
