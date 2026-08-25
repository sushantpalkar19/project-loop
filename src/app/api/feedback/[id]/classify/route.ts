/**
 * POST /api/feedback/:id/classify
 *
 * Manually re-classify a feedback record using Claude AI.
 * Requires ADMIN or ANALYST role.
 * Workspace isolation enforced server-side.
 *
 * This endpoint:
 * 1. Locates the feedback by id + workspaceId
 * 2. Re-runs Claude classification
 * 3. Clears stale theme associations
 * 4. Persists new classification (sentiment, themes, urgency, summary)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { reclassifyAndPersist } from "@/lib/ai/integration";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate + require ADMIN or ANALYST
    const user = await requireRole(["ADMIN", "ANALYST"]);

    // 2. Find feedback — workspace scoped
    const feedback = await db.feedback.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
      select: {
        id: true,
        content: true,
        channel: true,
        sentiment: true,
        sentimentScore: true,
        urgency: true,
        shortSummary: true,
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

    // 3. Reclassify — clears old themes, creates new ones
    const classification = await reclassifyAndPersist(
      feedback.id,
      feedback.content,
      user.workspaceId
    );

    if (!classification) {
      return NextResponse.json(
        {
          error: "Classification failed — feedback was not updated",
          feedbackId: params.id,
        },
        { status: 500 }
      );
    }

    // 4. Re-fetch the updated feedback with new themes
    const updatedFeedback = await db.feedback.findFirst({
      where: {
        id: params.id,
        workspaceId: user.workspaceId,
      },
      select: {
        id: true,
        content: true,
        channel: true,
        sentiment: true,
        sentimentScore: true,
        urgency: true,
        shortSummary: true,
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

    return NextResponse.json({
      message: "Classification completed",
      feedback: updatedFeedback,
      classification: {
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        urgency: classification.urgency,
        confidence: classification.confidence,
        shortSummary: classification.shortSummary,
        themes: classification.themes,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    // Classification failure — return controlled error without exposing internals
    if (
      error instanceof Error &&
      "code" in error &&
      typeof (error as { code: string }).code === "string"
    ) {
      const aiError = error as { code: string; message: string };
      console.error(
        `[AI Classification] Failed for feedback ${params.id}:`,
        aiError.message
      );
      return NextResponse.json(
        {
          error: "Classification failed",
          details: aiError.message,
          feedbackId: params.id,
        },
        { status: 500 }
      );
    }

    console.error("Classify feedback error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
