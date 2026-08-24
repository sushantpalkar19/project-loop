/**
 * PATCH /api/workspace/members/:id
 *
 * Updates a member's role within the authenticated user's workspace.
 * Requires ADMIN role.
 *
 * Request body: { role: "ADMIN" | "ANALYST" | "VIEWER" }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";

// ── Validation ────────────────────────────────

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]),
});

// ── Handler ───────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate + require ADMIN
    const admin = await requireRole(["ADMIN"]);

    // 2. Parse and validate request body
    const body = await request.json();
    const result = updateRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, ANALYST, or VIEWER" },
        { status: 400 }
      );
    }

    const { role } = result.data;
    const targetUserId = params.id;

    // 3. Find target user — MUST belong to the same workspace
    const targetUser = await db.user.findFirst({
      where: {
        id: targetUserId,
        workspaceId: admin.workspaceId,
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

    // 4. Prevent self-demotion (optional safety measure)
    if (targetUser.id === admin.id && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot change your own admin role" },
        { status: 400 }
      );
    }

    // 5. Update the role
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
