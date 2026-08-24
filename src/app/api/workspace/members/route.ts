/**
 * GET /api/workspace/members
 *
 * Returns all members of the authenticated user's workspace.
 * Requires ADMIN role.
 */

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // 1. Authenticate + require ADMIN
    const user = await requireRole(["ADMIN"]);

    // 2. Query members — scoped to authenticated workspace only
    const members = await db.user.findMany({
      where: { workspaceId: user.workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. Return members
    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
