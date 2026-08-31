/**
 * POST /api/feedback — Create feedback
 * GET  /api/feedback — List feedback (with search, filters, pagination)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  createFeedbackSchema,
  feedbackQuerySchema,
} from "@/lib/validations/feedback";
import { classifyAndPersistSafe, generateAndPersistEmbeddingSafe } from "@/lib/ai/integration";

// ── POST: Create Feedback ─────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate + require ADMIN or ANALYST
    const user = await requireRole(["ADMIN", "ANALYST"]);

    // 2. Validate request body
    const body = await request.json();
    const result = createFeedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 3. Create feedback — workspaceId from session only
    const feedback = await db.feedback.create({
      data: {
        workspaceId: user.workspaceId,
        content: result.data.content,
        channel: result.data.channel,
        sourceRef: result.data.sourceRef ?? null,
        customerLabel: result.data.customerLabel ?? null,
        sentiment: "NEU",
        sentimentScore: 0,
        status: "NEW",
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
      },
    });

    // 4. Classify feedback with Claude AI (async — does not block response)
    // If classification fails, the feedback is still created with default NEU sentiment.
    classifyAndPersistSafe(feedback.id, result.data.content, user.workspaceId);

    // 5. Generate embedding for semantic search (synchronous — blocks response)
    // This ensures feedback is fully indexed before returning to user.
    // If embedding generation fails, return an error to the user.
    try {
      const { generateAndPersistEmbedding } = await import("@/lib/ai/integration");
      await generateAndPersistEmbedding(feedback.id, result.data.content);
    } catch (error) {
      console.error("[Feedback Creation] Embedding generation failed:", error);
      // Delete the feedback since embedding failed - user should retry
      await db.feedback.delete({ where: { id: feedback.id } });
      return NextResponse.json(
        { error: "Failed to generate embedding for semantic search. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Create feedback error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ── GET: List Feedback ────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = feedbackQuerySchema.safeParse({
      page: searchParams.get("page") ?? 1,
      pageSize: searchParams.get("pageSize") ?? 20,
      search: searchParams.get("search") ?? undefined,
      channel: searchParams.get("channel") ?? undefined,
      sentiment: searchParams.get("sentiment") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      themeId: searchParams.get("themeId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { page, pageSize, search, channel, sentiment, status, themeId, dateFrom, dateTo } =
      queryResult.data;

    // 3. Build where clause — workspace isolation
    const where: Record<string, unknown> = {
      workspaceId: user.workspaceId,
    };

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    if (channel) {
      where.channel = channel;
    }

    if (sentiment) {
      where.sentiment = sentiment;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.createdAt as Record<string, Date>).lte = dateTo;
    }

    // Theme filter — requires join through FeedbackTheme
    if (themeId) {
      where.themes = {
        some: { themeId },
      };
    }

    // 4. Query with pagination
    const [feedback, total] = await Promise.all([
      db.feedback.findMany({
        where,
        select: {
          id: true,
          content: true,
          channel: true,
          sourceRef: true,
          customerLabel: true,
          sentiment: true,
          sentimentScore: true,
          confidence: true,
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.feedback.count({ where }),
    ]);

    // 5. Return paginated response
    return NextResponse.json({
      feedback,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("List feedback error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
