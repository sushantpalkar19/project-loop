/**
 * GET /api/reports/[id]/pdf -- Download a report as PDF
 *
 * Requires authenticated session with ADMIN, ANALYST, or VIEWER role.
 * Workspace isolation is enforced through the session workspaceId.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { generateReportPDF } from "@/lib/pdf/report-pdf";
import type { VoiceOfCustomerReportContent } from "@/lib/validations/reports";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

    const reportId = params.id;

    // Fetch the report with workspace isolation
    const report = await db.report.findUnique({
      where: {
        id: reportId,
        workspaceId: user.workspaceId,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    if (!report.contentJson) {
      return NextResponse.json(
        { error: "Report content is missing" },
        { status: 400 }
      );
    }

    // Cast contentJson to the expected type
    const content = report.contentJson as VoiceOfCustomerReportContent;

    // Generate PDF
    const pdfBuffer = await generateReportPDF({
      title: report.title,
      periodLabel: content.period.label,
      generatedAt: content.generatedAt,
      generatedBy: report.author?.name || report.author?.email || "LOOP user",
      content,
    });

    // Return PDF as downloadable file
    const filename = `LOOP-VoC-Report-${report.title.replace(/\s+/g, "_")}-${new Date(report.createdAt).toISOString().split("T")[0]}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
