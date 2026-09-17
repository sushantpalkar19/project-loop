/**
 * PATCH /api/workspace/members/:id
 *
 * Updates a member's role within the authenticated user's workspace.
 * Requires ADMIN or MANAGER role.
 * MANAGER cannot grant ADMIN role or modify existing ADMIN users.
 *
 * Request body: { role: "ADMIN" | "MANAGER" | "ANALYST" | "VIEWER" }
 *
 * DELETE /api/workspace/members/:id
 *
 * Removes a member from the authenticated user's workspace.
 * Requires ADMIN or MANAGER role.
 * MANAGER cannot remove ADMIN users.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { createLog } from "@/lib/logs";

// ── Validation ────────────────────────────────

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "ANALYST", "VIEWER"]),
});

// ── Handler ───────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate + require ADMIN or MANAGER
    const user = await requireRole(["ADMIN", "MANAGER"]);

    // 2. Parse and validate request body
    const body = await request.json();
    const result = updateRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, MANAGER, ANALYST, or VIEWER" },
        { status: 400 }
      );
    }

    const { role } = result.data;
    const targetUserId = params.id;

    // 3. Find target user — MUST belong to the same workspace
    const targetUser = await db.user.findFirst({
      where: {
        id: targetUserId,
        workspaceId: user.workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found in your workspace" },
        { status: 404 }
      );
    }

    // 4. MANAGER privilege escalation checks
    if (user.role === "MANAGER") {
      if (role === "ADMIN") {
        return NextResponse.json(
          { error: "Managers cannot grant ADMIN role" },
          { status: 403 }
        );
      }
      if (targetUser.role === "ADMIN") {
        return NextResponse.json(
          { error: "Managers cannot modify Admin accounts" },
          { status: 403 }
        );
      }
    }

    // 5. Prevent self-demotion (optional safety measure)
    if (targetUser.id === user.id && targetUser.role === "ADMIN" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot change your own admin role" },
        { status: 400 }
      );
    }

    // 6. Update the role
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // 7. Log the role change
    createLog({
      workspaceId: user.workspaceId,
      action: "member.role_changed",
      message: `Changed ${targetUser.email} role from ${targetUser.role} to ${role}`,
      userId: user.id,
      userName: user.name || user.email,
      metadata: { targetUserId: targetUser.id, email: targetUser.email, fromRole: targetUser.role, toRole: role },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ── DELETE: Remove Member ───────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate + require ADMIN or MANAGER
    const user = await requireRole(["ADMIN", "MANAGER"]);

    const targetUserId = params.id;

    // 2. Prevent self-deletion
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot remove your own account" },
        { status: 400 }
      );
    }

    // 3. Find target user — MUST belong to the same workspace
    const targetUser = await db.user.findFirst({
      where: {
        id: targetUserId,
        workspaceId: user.workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found in your workspace" },
        { status: 404 }
      );
    }

    // 4. Prevent deleting ADMIN users (workspace owners)
    // Both ADMIN and MANAGER cannot delete ADMIN users
    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot remove Admin users from the workspace" },
        { status: 403 }
      );
    }

    // 5. Delete the user (cascade will handle related records)
    await db.user.delete({
      where: { id: targetUserId },
    });

    // 6. Log the removal
    createLog({
      workspaceId: user.workspaceId,
      action: "member.removed",
      message: `Removed member ${targetUser.email} (${targetUser.role}) from workspace`,
      userId: user.id,
      userName: user.name || user.email,
      metadata: { removedUserId: targetUserId, email: targetUser.email, role: targetUser.role },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
