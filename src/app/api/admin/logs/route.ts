/**
 * GET /api/admin/logs
 *
 * Returns paginated activity logs for the authenticated admin's workspace.
 * Requires ADMIN role.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/permissions";
import { fetchLogs } from "@/lib/logs";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    // 1. Require ADMIN role
    const user = await requireRole(["ADMIN"]);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      action: searchParams.get("action") ?? undefined,
    };
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    // 3. Fetch logs scoped to authenticated workspace
    const result = await fetchLogs({
      workspaceId: user.workspaceId,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      action: parsed.data.action,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Get logs error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
