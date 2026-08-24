/**
 * GET    /api/feedback/:id — Get single feedback
 * PATCH  /api/feedback/:id — Update feedback
 * DELETE /api/feedback/:id — Delete feedback
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { updateFeedbackSchema } from "@/lib/validations/feedback";

// ── GET: Retrieve Single Feedback ─────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate
    const user = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

    // 2. Find feedback — scoped to workspace
    const feedback = await db.feedback.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
      select: {
        id: true,
        content: true,
        channel: true,
        sourceRef: true,
        customerLabel: true,
        sentiment: true,
        sentimentScore: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        themes: {
          select: {
            theme: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            confidence: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Get feedback error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ── PATCH: Update Feedback ────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate + require ADMIN or ANALYST
    const user = await requireRole(["ADMIN", "ANALYST"]);

    // 2. Validate request body
    const body = await request.json();
    const result = updateFeedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 3. Find existing feedback — workspace scoped
    const existing = await db.feedback.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // 4. Validate status transition
    if (result.data.status && result.data.status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        NEW: ["REVIEWED"],
        REVIEWED: ["ACTIONED"],
        ACTIONED: [],
      };

      if (!validTransitions[existing.status]?.includes(result.data.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from ${existing.status} to ${result.data.status}`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Update feedback
    const feedback = await db.feedback.update({
      where: { id: params.id },
      data: result.data,
      select: {
        id: true,
        content: true,
        channel: true,
        sourceRef: true,
        customerLabel: true,
        sentiment: true,
        sentimentScore: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Update feedback error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ── DELETE: Delete Feedback ───────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate + require ADMIN or ANALYST
    const user = await requireRole(["ADMIN", "ANALYST"]);

    // 2. Find existing feedback — workspace scoped
    const existing = await db.feedback.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // 3. Delete feedback (cascades to FeedbackTheme and Embedding)
    await db.feedback.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Feedback deleted" });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Delete feedback error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
