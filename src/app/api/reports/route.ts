/**
 * GET  /api/reports -- List generated Voice-of-Customer reports
 * POST /api/reports -- Generate and save a new report
 *
 * Requires authenticated session. Workspace isolation is enforced through the
 * session workspaceId only; client-supplied workspace IDs are never accepted.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import {
  generateReportRequestSchema,
  normalizeReportDateRange,
  reportListQuerySchema,
} from "@/lib/validations/reports";
import {
  generateVoiceOfCustomerReport,
  isReportGenerationError,
  listReports,
  type ReportGenerationErrorCode,
} from "@/lib/reports";
import { createLog } from "@/lib/logs";

function isRetryableReportError(code: ReportGenerationErrorCode): boolean {
  const retryableCodes: ReportGenerationErrorCode[] = [
    "NARRATIVE_GENERATION_FAILED",
  ];
  return retryableCodes.includes(code);
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "ANALYST", "VIEWER"]);

    const { searchParams } = new URL(request.url);
    const queryResult = reportListQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const reports = await listReports(user.workspaceId, queryResult.data.limit);

    return NextResponse.json({ reports });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("List reports error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "ANALYST"]);
    const body = await request.json();
    const result = generateReportRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { periodStart, periodEnd } = normalizeReportDateRange(result.data);
    const report = await generateVoiceOfCustomerReport({
      workspaceId: user.workspaceId,
      userId: user.id,
      periodStart,
      periodEnd,
    });

    // Log the report generation
    createLog({
      workspaceId: user.workspaceId,
      action: "report.generated",
      message: `Generated Voice of Customer report for ${periodStart} to ${periodEnd}`,
      userId: user.id,
      userName: user.name || user.email,
      metadata: { reportId: report.id, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    if (isReportGenerationError(error)) {
      if (process.env.NODE_ENV === "development" && error.details) {
        console.error(`[Reports] ${error.code}:`, error.details);
      }

      // Log the error for debugging without exposing sensitive data
      console.error(`[Reports] Generation failed with code: ${error.code}`);

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryable: isRetryableReportError(error.code),
        },
        { status: error.httpStatus ?? 500 }
      );
    }

    console.error("Generate report error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while generating the report.",
        code: "UNKNOWN_ERROR",
        retryable: false,
      },
      { status: 500 }
    );
  }
}
