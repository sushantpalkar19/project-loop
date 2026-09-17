/**
 * GET /api/workspace/members
 *
 * Returns all members of the authenticated user's workspace.
 * Requires ADMIN or MANAGER role.
 *
 * POST /api/workspace/members
 *
 * Creates a new member in the authenticated user's workspace.
 * Requires ADMIN role.
 *
 * Request body: { email: string, name: string, password: string, role: "MANAGER" | "ANALYST" | "VIEWER" }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { createLog } from "@/lib/logs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Authenticate + require ADMIN or MANAGER
    const user = await requireRole(["ADMIN", "MANAGER"]);

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

// ── POST: Create Member ───────────────────────────

const createMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
  role: z.enum(["MANAGER", "ANALYST", "VIEWER"]),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate + require ADMIN
    const admin = await requireRole(["ADMIN"]);

    // 2. Parse and validate request body
    const body = await request.json();
    const result = createMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, name, password, role } = result.data;

    // 3. Check if email already exists in the workspace
    const existingUser = await db.user.findFirst({
      where: {
        email,
        workspaceId: admin.workspaceId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists in your workspace" },
        { status: 409 }
      );
    }

    // 4. Hash password
    const passwordHash = await hash(password, 12);

    // 5. Create user in the same workspace
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        workspaceId: admin.workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 6. Log the action
    createLog({
      workspaceId: admin.workspaceId,
      action: "member.created",
      message: `Added member ${name} (${email}) with role ${role}`,
      userId: admin.id,
      userName: admin.name || admin.email,
      metadata: { newUserId: user.id, email, role },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Create member error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
