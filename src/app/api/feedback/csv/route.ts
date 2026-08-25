/**
 * POST /api/feedback/csv
 *
 * Bulk import feedback from CSV file.
 * Requires ADMIN or ANALYST role.
 * workspaceId from authenticated session only.
 *
 * CSV columns:
 *   content (required)
 *   channel (required)
 *   customer_label (optional)
 *   created_at (optional)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { FEEDBACK_CHANNELS } from "@/lib/constants";
import { classifyBatch } from "@/lib/ai/integration";

// ── Constants ─────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 1000;

// ── Types ─────────────────────────────────────

interface CsvRow {
  content?: string;
  channel?: string;
  customer_label?: string;
  created_at?: string;
}

interface RowError {
  row: number;
  errors: string[];
  data: CsvRow;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: RowError[];
}

// ── CSV Parser ────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  // Parse header
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Parse rows
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      const value = values[index] || "";
      if (header === "content") row.content = value;
      else if (header === "channel") row.channel = value;
      else if (header === "customer_label") row.customer_label = value;
      else if (header === "created_at") row.created_at = value;
    });

    rows.push(row);
  }

  return rows;
}

// ── Row Validator ─────────────────────────────

function validateRow(row: CsvRow, rowNum: number): string[] {
  const errors: string[] = [];

  // Content is required
  if (!row.content || row.content.trim() === "") {
    errors.push("content is required");
  } else if (row.content.length > 10000) {
    errors.push("content exceeds maximum length of 10000 characters");
  }

  // Channel is required
  if (!row.channel || row.channel.trim() === "") {
    errors.push("channel is required");
  } else if (!FEEDBACK_CHANNELS.includes(row.channel.toLowerCase() as typeof FEEDBACK_CHANNELS[number])) {
    errors.push(
      `channel must be one of: ${FEEDBACK_CHANNELS.join(", ")}`
    );
  }

  // Validate created_at format if provided
  if (row.created_at && row.created_at.trim() !== "") {
    const date = new Date(row.created_at);
    if (isNaN(date.getTime())) {
      errors.push("created_at is not a valid date");
    }
  }

  // Validate optional fields length
  if (row.customer_label && row.customer_label.length > 255) {
    errors.push("customer_label exceeds maximum length of 255 characters");
  }

  return errors;
}

// ── POST Handler ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate + require ADMIN or ANALYST
    const user = await requireRole(["ADMIN", "ANALYST"]);

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 3. Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only .csv files are accepted" },
        { status: 400 }
      );
    }

    if (file.type && !file.type.includes("csv") && !file.type.includes("text")) {
      return NextResponse.json(
        { error: "Only .csv files are accepted" },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    // 5. Read and parse CSV
    const content = await file.text();
    const rows = parseCsv(content);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or has no data rows" },
        { status: 400 }
      );
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `File exceeds maximum of ${MAX_ROWS} rows` },
        { status: 400 }
      );
    }

    // 6. Validate all rows
    const result: ImportResult = {
      totalRows: rows.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    const validRows: Array<{
      workspaceId: string;
      content: string;
      channel: string;
      customerLabel: string | null;
      sentiment: "NEU";
      sentimentScore: number;
      status: "NEW";
      createdAt?: Date;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header
      const errors = validateRow(row, rowNum);

      if (errors.length > 0) {
        result.errors.push({ row: rowNum, errors, data: row });
        result.errorCount++;
      } else {
        validRows.push({
          workspaceId: user.workspaceId,
          content: row.content!.trim(),
          channel: row.channel!.toLowerCase().trim(),
          customerLabel: row.customer_label?.trim() || null,
          sentiment: "NEU",
          sentimentScore: 0,
          status: "NEW",
          createdAt: row.created_at
            ? new Date(row.created_at)
            : undefined,
        });
      }
    }

    // 7. Bulk insert valid rows
    if (validRows.length > 0) {
      await db.feedback.createMany({
        data: validRows.map((row) => ({
          workspaceId: row.workspaceId,
          content: row.content,
          channel: row.channel,
          customerLabel: row.customerLabel,
          sentiment: row.sentiment,
          sentimentScore: row.sentimentScore,
          status: row.status,
          ...(row.createdAt && { createdAt: row.createdAt }),
        })),
        skipDuplicates: false,
      });

      result.successCount = validRows.length;

      // 8. Fetch inserted records for classification
      // Query recent records matching the imported content to get their IDs
      const recentCutoff = new Date(Date.now() - 60 * 1000); // 60 seconds ago
      const insertedRecords = await db.feedback.findMany({
        where: {
          workspaceId: user.workspaceId,
          createdAt: { gte: recentCutoff },
          content: {
            in: validRows.map((r) => r.content),
          },
        },
        select: {
          id: true,
          content: true,
        },
      });

      // 9. Classify imported records (fire-and-forget, non-blocking)
      // Classification runs in the background after the response is sent.
      // Each record is classified independently — failures don't stop others.
      if (insertedRecords.length > 0) {
        classifyBatch(insertedRecords, user.workspaceId);
      }
    }

    // 10. Return result
    return NextResponse.json({
      message: `Import complete: ${result.successCount} imported, ${result.errorCount} failed`,
      result,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during import" },
      { status: 500 }
    );
  }
}
