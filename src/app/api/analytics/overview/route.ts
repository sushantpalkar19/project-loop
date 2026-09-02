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

export const dynamic = "force-dynamic";

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
  count: number;
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
      (() => {
        if (dateFrom && dateTo) {
          return db.$queryRaw<ThemeCount[]>`
            SELECT
              ft."themeId",
              COUNT(*)::int AS count
            FROM "FeedbackTheme" ft
            INNER JOIN "Feedback" f ON f.id = ft."feedbackId"
            INNER JOIN "Theme" t ON t.id = ft."themeId"
            WHERE f."workspaceId" = ${user.workspaceId}
              AND t."workspaceId" = ${user.workspaceId}
              AND f."createdAt" >= ${dateFrom}
              AND f."createdAt" <= ${endOfDay(dateTo)}
            GROUP BY ft."themeId"
            ORDER BY count DESC
            LIMIT 10
          `;
        } else if (dateFrom) {
          return db.$queryRaw<ThemeCount[]>`
            SELECT
              ft."themeId",
              COUNT(*)::int AS count
            FROM "FeedbackTheme" ft
            INNER JOIN "Feedback" f ON f.id = ft."feedbackId"
            INNER JOIN "Theme" t ON t.id = ft."themeId"
            WHERE f."workspaceId" = ${user.workspaceId}
              AND t."workspaceId" = ${user.workspaceId}
              AND f."createdAt" >= ${dateFrom}
            GROUP BY ft."themeId"
            ORDER BY count DESC
            LIMIT 10
          `;
        } else if (dateTo) {
          return db.$queryRaw<ThemeCount[]>`
            SELECT
              ft."themeId",
              COUNT(*)::int AS count
            FROM "FeedbackTheme" ft
            INNER JOIN "Feedback" f ON f.id = ft."feedbackId"
            INNER JOIN "Theme" t ON t.id = ft."themeId"
            WHERE f."workspaceId" = ${user.workspaceId}
              AND t."workspaceId" = ${user.workspaceId}
              AND f."createdAt" <= ${endOfDay(dateTo)}
            GROUP BY ft."themeId"
            ORDER BY count DESC
            LIMIT 10
          `;
        } else {
          return db.$queryRaw<ThemeCount[]>`
            SELECT
              ft."themeId",
              COUNT(*)::int AS count
            FROM "FeedbackTheme" ft
            INNER JOIN "Feedback" f ON f.id = ft."feedbackId"
            INNER JOIN "Theme" t ON t.id = ft."themeId"
            WHERE f."workspaceId" = ${user.workspaceId}
              AND t."workspaceId" = ${user.workspaceId}
            GROUP BY ft."themeId"
            ORDER BY count DESC
            LIMIT 10
          `;
        }
      })(),

      // Volume by date — raw SQL for DATE_TRUNC
      (() => {
        if (dateFrom && dateTo) {
          return db.$queryRaw<VolumeRow[]>`
            SELECT
              DATE_TRUNC('day', "createdAt")::date AS day,
              COUNT(*)::int AS count
            FROM "Feedback"
            WHERE "workspaceId" = ${user.workspaceId}
              AND "createdAt" >= ${dateFrom}
              AND "createdAt" <= ${endOfDay(dateTo)}
            GROUP BY day
            ORDER BY day ASC
          `;
        } else if (dateFrom) {
          return db.$queryRaw<VolumeRow[]>`
            SELECT
              DATE_TRUNC('day', "createdAt")::date AS day,
              COUNT(*)::int AS count
            FROM "Feedback"
            WHERE "workspaceId" = ${user.workspaceId}
              AND "createdAt" >= ${dateFrom}
            GROUP BY day
            ORDER BY day ASC
          `;
        } else if (dateTo) {
          return db.$queryRaw<VolumeRow[]>`
            SELECT
              DATE_TRUNC('day', "createdAt")::date AS day,
              COUNT(*)::int AS count
            FROM "Feedback"
            WHERE "workspaceId" = ${user.workspaceId}
              AND "createdAt" <= ${endOfDay(dateTo)}
            GROUP BY day
            ORDER BY day ASC
          `;
        } else {
          return db.$queryRaw<VolumeRow[]>`
            SELECT
              DATE_TRUNC('day', "createdAt")::date AS day,
              COUNT(*)::int AS count
            FROM "Feedback"
            WHERE "workspaceId" = ${user.workspaceId}
            GROUP BY day
            ORDER BY day ASC
          `;
        }
      })(),
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
        count: t.count,
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
