/**
 * POST /api/admin/reindex
 *
 * Reindex (backfill) embedding vectors for feedback records in the
 * authenticated admin's workspace that are missing embeddings.
 *
 * Requires ADMIN role.
 * workspaceId from authenticated session — never from request body.
 *
 * Query params:
 *   regenerate=true  — regenerate ALL embeddings, not just missing ones
 *   limit=N          — max records to process (default: 500, max: 2000)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { generateAndPersistEmbedding } from "@/lib/ai/integration";
import { isGeminiAvailable } from "@/lib/ai/embeddings";
import { createLog } from "@/lib/logs";
import { z } from "zod";

// ── Configuration ─────────────────────────────

const BATCH_SIZE = 10;      // records per concurrent batch
const BATCH_DELAY_MS = 300; // ms between batches (rate limit buffer)

const querySchema = z.object({
  regenerate: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(2000)
    .default(500),
});

// ── POST Handler ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Require ADMIN role — only admins can trigger reindexing
    const user = await requireRole(["ADMIN"]);

    // 2. Check Gemini is configured
    if (!isGeminiAvailable()) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured. Set it in your environment variables.",
          hint: "Without GEMINI_API_KEY, embedding generation is unavailable.",
        },
        { status: 503 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      regenerate: searchParams.get("regenerate") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { regenerate, limit } = parsed.data;

    console.log(
      `[Reindex] ADMIN ${user.id.substring(0, 8)}... triggered reindex for workspace ${user.workspaceId.substring(0, 8)}... ` +
      `(regenerate=${regenerate}, limit=${limit})`
    );

    // 4. Count total feedback in workspace
    const totalFeedback = await db.feedback.count({
      where: { workspaceId: user.workspaceId },
    });

    console.log(`[Reindex] Workspace has ${totalFeedback} total feedback records`);

    // 5. Find feedback records to process
    // If regenerate=true, process all records; otherwise only those without embeddings
    const feedbackToProcess = await db.feedback.findMany({
      where: regenerate
        ? { workspaceId: user.workspaceId }
        : {
            workspaceId: user.workspaceId,
            embedding: null, // Only records without an existing embedding
          },
      select: { id: true, content: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const totalToProcess = feedbackToProcess.length;

    if (totalToProcess === 0) {
      const embeddingCount = await db.embedding.count({
        where: { feedback: { workspaceId: user.workspaceId } },
      });

      console.log(`[Reindex] Nothing to process. All ${embeddingCount} records already indexed.`);

      return NextResponse.json({
        message: regenerate
          ? "No feedback records found in workspace."
          : "All feedback records are already indexed. Use ?regenerate=true to force reindex.",
        processed: 0,
        succeeded: 0,
        failed: 0,
        totalFeedback,
        embeddingCount,
        skipped: 0,
      });
    }

    console.log(`[Reindex] Processing ${totalToProcess} records in batches of ${BATCH_SIZE}...`);

    // 6. Process in batches with bounded concurrency
    let succeeded = 0;
    let failed = 0;
    const failures: Array<{ id: string; error: string }> = [];

    for (let i = 0; i < feedbackToProcess.length; i += BATCH_SIZE) {
      const batch = feedbackToProcess.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((record) => generateAndPersistEmbedding(record.id, record.content))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const record = batch[j];

        if (result.status === "fulfilled") {
          succeeded++;
        } else {
          failed++;
          const errMsg = result.reason instanceof Error ? result.reason.message : "Unknown error";
          failures.push({ id: record.id, error: errMsg });
          console.error(`[Reindex] Failed to embed record ${record.id}:`, errMsg);
        }
      }

      console.log(
        `[Reindex] Batch ${Math.ceil((i + 1) / BATCH_SIZE)}: succeeded=${succeeded}, failed=${failed}`
      );

      // Rate limit buffer between batches (except after the last batch)
      if (i + BATCH_SIZE < feedbackToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // 7. Final embedding count
    const finalEmbeddingCount = await db.embedding.count({
      where: { feedback: { workspaceId: user.workspaceId } },
    });

    console.log(
      `[Reindex] Complete — succeeded=${succeeded}, failed=${failed}, ` +
      `totalEmbeddings=${finalEmbeddingCount}`
    );

    // 8. Log the reindex operation
    createLog({
      workspaceId: user.workspaceId,
      action: "admin.reindex",
      message: `Reindexed ${succeeded} feedback embeddings (${failed} failed, ${totalToProcess} attempted)`,
      userId: user.id,
      userName: user.name || user.email,
      metadata: {
        succeeded,
        failed,
        totalToProcess,
        regenerate,
        finalEmbeddingCount,
      },
    });

    // 9. Return result
    const response = {
      message: `Reindex complete: ${succeeded} indexed, ${failed} failed`,
      processed: totalToProcess,
      succeeded,
      failed,
      totalFeedback,
      embeddingCount: finalEmbeddingCount,
      skipped: totalFeedback - totalToProcess,
    };

    // Include failure details only if there were failures (never include content or PII)
    if (failures.length > 0) {
      return NextResponse.json(
        { ...response, failures: failures.slice(0, 20) }, // cap at 20 to avoid huge responses
        { status: failed === totalToProcess ? 502 : 207 } // 207 = partial success
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("[Reindex] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during reindexing" },
      { status: 500 }
    );
  }
}

// ── GET: Status ───────────────────────────────

export async function GET() {
  try {
    // 1. Require ADMIN role
    const user = await requireRole(["ADMIN"]);

    // 2. Count stats for the workspace
    const [totalFeedback, embeddingCount] = await Promise.all([
      db.feedback.count({ where: { workspaceId: user.workspaceId } }),
      db.embedding.count({ where: { feedback: { workspaceId: user.workspaceId } } }),
    ]);

    const missing = totalFeedback - embeddingCount;

    return NextResponse.json({
      totalFeedback,
      embeddingCount,
      missingEmbeddings: missing,
      isFullyIndexed: missing === 0,
      geminiAvailable: isGeminiAvailable(),
      hint: missing > 0
        ? `${missing} feedback record(s) have no embedding. POST to /api/admin/reindex to fix.`
        : "All feedback records are indexed.",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("[Reindex] Status check error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
