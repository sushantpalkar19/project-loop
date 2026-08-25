/**
 * GET /api/analytics/overview
 *
 * Server-side aggregated analytics for the Project LOOP dashboard.
 * Returns sentiment breakdown, top themes, volume over time, and key metrics.
 *
 * Requires authentication. All roles (ADMIN, ANALYST, VIEWER) may read.
 * All queries scoped to authenticated user's workspace.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";

// ── Query Validation ──────────────────────────

const analyticsQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// ── Types ─────────────────────────────────────

interface SentimentCount {
  sentiment: string;
  count: number;
}

interface ThemeCount {
  themeId: string;
  _count: { themeId: number };
}

interface ThemeDetail {
  id: string;
  name: string;
  color: string | null;
}

interface VolumeRow {
  day: Date;
  count: number;
}

// ── Helpers ───────────────────────────────────

/** End-of-day boundary so dateTo includes the entire day */
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ── GET Handler ───────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate — all roles may read analytics
    const user = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

    // 2. Parse optional date range
    const { searchParams } = new URL(request.url);
    const queryResult = analyticsQuerySchema.safeParse({
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo } = queryResult.data;

    // 3. Build base where clause — workspace isolation
    const baseWhere: Record<string, unknown> = {
      workspaceId: user.workspaceId,
    };

    // Date range filter (applies to most metrics)
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = dateFrom;
      if (dateTo) createdAt.lte = endOfDay(dateTo);
      baseWhere.createdAt = createdAt;
    }

    // 4. Run all queries in parallel
    const [
      totalFeedback,
      sentimentGroups,
      newThisWeekCount,
      themeCounts,
      volumeRows,
    ] = await Promise.all([
      // Total feedback count
      db.feedback.count({ where: baseWhere }),

      // Sentiment breakdown
      db.feedback.groupBy({
        by: ["sentiment"],
        where: baseWhere,
        _count: { sentiment: true },
      }),

      // New this week — always uses rolling 7-day window, not dateFrom/dateTo
      db.feedback.count({
        where: {
          workspaceId: user.workspaceId,
          status: "NEW",
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Top themes — join through FeedbackTheme, scoped to workspace
      db.feedbackTheme.groupBy({
        by: ["themeId"],
        where: {
          feedback: baseWhere,
          theme: { workspaceId: user.workspaceId },
        },
        _count: { themeId: true },
        orderBy: { _count: { themeId: "desc" } },
        take: 10,
      }),

      // Volume by date — raw SQL for DATE_TRUNC
      db.$queryRaw<VolumeRow[]>`
        SELECT
          DATE_TRUNC('day', "createdAt")::date AS day,
          COUNT(*)::int AS count
        FROM "Feedback"
        WHERE "workspaceId" = ${user.workspaceId}
        ${dateFrom ? db.$queryRaw`AND "createdAt" >= ${dateFrom}` : db.$queryRaw``}
        ${dateTo ? db.$queryRaw`AND "createdAt" <= ${endOfDay(dateTo)}` : db.$queryRaw``}
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    // 5. Fetch theme details for the top themes
    const themeIds = themeCounts.map((t) => t.themeId);
    const themeDetails =
      themeIds.length > 0
        ? await db.theme.findMany({
            where: { id: { in: themeIds } },
            select: { id: true, name: true, color: true },
          })
        : [];

    const themeDetailMap = new Map<string, ThemeDetail>(
      themeDetails.map((t) => [t.id, t])
    );

    // 6. Compute sentiment percentages
    const sentimentBreakdown = {
      POS: { count: 0, percentage: 0 },
      NEU: { count: 0, percentage: 0 },
      NEG: { count: 0, percentage: 0 },
    };

    for (const group of sentimentGroups) {
      const key = group.sentiment as "POS" | "NEU" | "NEG";
      if (key in sentimentBreakdown) {
        sentimentBreakdown[key] = {
          count: group._count.sentiment,
          percentage:
            totalFeedback > 0
              ? Math.round(
                  (group._count.sentiment / totalFeedback) * 1000
                ) / 10
              : 0,
        };
      }
    }

    // Negative percentage for stat card
    const negativePercentage = sentimentBreakdown.NEG.percentage;

    // 7. Build themes response
    const themes = themeCounts.map((t) => {
      const detail = themeDetailMap.get(t.themeId);
      return {
        themeId: t.themeId,
        name: detail?.name ?? "Unknown",
        color: detail?.color ?? null,
        count: t._count.themeId,
      };
    });

    // 8. Build volume response
    const volumeByDate = volumeRows.map((row) => ({
      date: row.day.toISOString().split("T")[0],
      count: row.count,
    }));

    // 9. Return clean response
    return NextResponse.json({
      metrics: {
        totalFeedback,
        negativePercentage,
        newThisWeek: newThisWeekCount,
      },
      sentiment: sentimentBreakdown,
      themes,
      volumeByDate,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Analytics overview error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
