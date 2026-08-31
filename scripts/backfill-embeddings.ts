/**
 * Project LOOP — Embedding Backfill Script
 *
 * This script generates embeddings for existing feedback records that don't have them.
 * It processes records in batches with concurrency limits to respect API rate limits.
 *
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts
 *
 * Environment variables required:
 *   DATABASE_URL - PostgreSQL connection string
 *   GEMINI_API_KEY - Google Gemini API key for embeddings
 *
 * Optional environment variables:
 *   WORKSPACE_ID - Specific workspace to backfill (if not set, processes all workspaces)
 *   REGENERATE - Set to "true" to regenerate existing embeddings (default: skip existing)
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { generateEmbeddingsBatch, isGeminiAvailable } from "../src/lib/ai/embeddings";
import { getFeedbackWithoutEmbeddings, countFeedbackWithoutEmbeddings } from "../src/lib/ai/vector-search";

// ── Configuration ───────────────────────────

const BATCH_SIZE = 50;
const MAX_TOTAL = 1000; // Safety limit to prevent runaway costs

// ── Main Function ──────────────────────────

async function main() {
  console.log("🔄 Starting embedding backfill...");

  // 1. Check if Gemini API is available
  if (!isGeminiAvailable()) {
    console.error("❌ GEMINI_API_KEY is not set. Please configure it in .env");
    process.exit(1);
  }

  // 2. Check if we should regenerate existing embeddings
  const regenerate = process.env.REGENERATE === "true";
  if (regenerate) {
    console.log("⚠️  REGENERATE mode enabled: Will regenerate ALL embeddings (including existing ones)");
  }

  // 3. Get target workspace (if specified)
  const targetWorkspaceId = process.env.WORKSPACE_ID;

  if (targetWorkspaceId) {
    console.log(`🎯 Targeting workspace: ${targetWorkspaceId}`);
  } else {
    console.log("⚠️  No specific workspace set. Will process ALL workspaces.");
    console.log("   To target a specific workspace, set WORKSPACE_ID environment variable.");
  }

  // 4. Count feedback without embeddings (or all if regenerating)
  let totalCount = 0;

  if (targetWorkspaceId) {
    totalCount = regenerate
      ? await db.feedback.count({ where: { workspaceId: targetWorkspaceId } })
      : await countFeedbackWithoutEmbeddings(targetWorkspaceId);
  } else {
    // Count across all workspaces
    const workspaces = await db.workspace.findMany({
      select: { id: true },
    });

    for (const ws of workspaces) {
      const count = regenerate
        ? await db.feedback.count({ where: { workspaceId: ws.id } })
        : await countFeedbackWithoutEmbeddings(ws.id);
      totalCount += count;
    }
  }

  if (totalCount === 0) {
    console.log("✅ All feedback records already have embeddings. Nothing to do.");
    console.log("   To regenerate existing embeddings, set REGENERATE=true");
    process.exit(0);
  }

  console.log(`📊 Found ${totalCount} feedback records to process`);

  // Apply safety limit
  const toProcess = Math.min(totalCount, MAX_TOTAL);
  if (toProcess < totalCount) {
    console.log(`⚠️  Safety limit: Processing only ${toProcess} of ${totalCount} records`);
  }

  // 5. Process feedback in batches
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  if (targetWorkspaceId) {
    const result = await processWorkspace(targetWorkspaceId, toProcess, regenerate);
    processed += result.processed;
    succeeded += result.succeeded;
    failed += result.failed;
  } else {
    // Process all workspaces
    const workspaces = await db.workspace.findMany({
      select: { id: true, name: true },
    });

    for (const ws of workspaces) {
      console.log(`\n📍 Processing workspace: ${ws.name} (${ws.id})`);
      const remaining = toProcess - processed;
      if (remaining <= 0) break;

      const result = await processWorkspace(ws.id, remaining, regenerate);
      processed += result.processed;
      succeeded += result.succeeded;
      failed += result.failed;
    }
  }

  // 6. Summary
  console.log("\n" + "=".repeat(50));
  console.log("📈 Backfill Summary");
  console.log("=".repeat(50));
  console.log(`Total processed: ${processed}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log("=".repeat(50));

  if (failed > 0) {
    console.log("⚠️  Some embeddings failed. Check logs above for details.");
    process.exit(1);
  } else {
    console.log("✅ Embedding backfill completed successfully!");
    process.exit(0);
  }
}

// ── Workspace Processor ───────────────────────

async function processWorkspace(
  workspaceId: string,
  limit: number,
  regenerate: boolean = false
): Promise<{ processed: number; succeeded: number; failed: number }> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  while (processed < limit) {
    const batchSize = Math.min(BATCH_SIZE, limit - processed);
    const feedback = regenerate
      ? await db.feedback.findMany({
          where: { workspaceId },
          select: { id: true, content: true },
          take: batchSize,
          orderBy: { createdAt: "desc" },
        })
      : await getFeedbackWithoutEmbeddings(workspaceId, batchSize);

    if (feedback.length === 0) {
      console.log("✅ No more feedback without embeddings in this workspace");
      break;
    }

    console.log(`📦 Processing batch of ${feedback.length} records...`);

    // Generate embeddings
    const { embeddings, failed: batchFailed } = await generateEmbeddingsBatch(
      feedback.map((f) => ({ id: f.id, text: f.content }))
    );

    // Persist embeddings to database using raw SQL (vector column not supported by Prisma)
    // Must use bracket notation for pgvector: [0.1,0.1,...] not {"0.1","0.1",...}
    for (const emb of embeddings) {
      try {
        const vecLiteral = `[${emb.vector.join(",")}]`;
        if (regenerate) {
          await db.$queryRaw`
            INSERT INTO "Embedding" (id, "feedbackId", vector)
            VALUES (gen_random_uuid()::text, ${emb.id}, ${vecLiteral}::vector)
            ON CONFLICT ("feedbackId") DO UPDATE SET vector = ${vecLiteral}::vector
          `;
        } else {
          await db.$queryRaw`
            INSERT INTO "Embedding" (id, "feedbackId", vector)
            VALUES (gen_random_uuid()::text, ${emb.id}, ${vecLiteral}::vector)
            ON CONFLICT ("feedbackId") DO NOTHING
          `;
        }
        succeeded++;
      } catch (error) {
        console.error(`❌ Failed to persist embedding for ${emb.id}:`, error);
        failed++;
      }
    }

    failed += batchFailed.length;
    processed += feedback.length;

    console.log(`✅ Batch complete: ${embeddings.length} succeeded, ${batchFailed.length} failed`);
    console.log(`📊 Progress: ${processed}/${limit} processed in this workspace`);

    // Small delay between batches to avoid overwhelming the database
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { processed, succeeded, failed };
}

// ── Run ───────────────────────────────────────

main().catch((error) => {
  console.error("❌ Fatal error during backfill:", error);
  process.exit(1);
});
