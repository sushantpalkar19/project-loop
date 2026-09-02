/**
 * GET /api/themes — List themes for the current workspace.
 * Requires authentication. Workspace-scoped.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

    const themes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ themes });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("List themes error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
