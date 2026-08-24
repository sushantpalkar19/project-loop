/**
 * Project LOOP — Permission Helpers
 *
 * Server-side authorization utilities.
 * All functions read from the authenticated session only.
 * Never accept workspaceId from client request bodies.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ── Types ─────────────────────────────────────

export type Role = "ADMIN" | "ANALYST" | "VIEWER";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  workspaceId: string;
}

// ── Helpers ───────────────────────────────────

/**
 * Get the currently authenticated user from the server-side session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? null,
    role: session.user.role as Role,
    workspaceId: session.user.workspaceId,
  };
}

/**
 * Require an authenticated user. Throws if not authenticated.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError("UNAUTHORIZED", "Authentication required");
  }

  return user;
}

/**
 * Require the authenticated user to have one of the specified roles.
 * Throws if not authenticated or role is insufficient.
 */
export async function requireRole(roles: Role[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw new AuthError(
      "FORBIDDEN",
      `Required role: ${roles.join(" or ")}`
    );
  }

  return user;
}

// ── Error Class ───────────────────────────────

export class AuthError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN";

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}
