/**
 * Project LOOP — Classification Integration
 *
 * Server-side module that ties Claude classification to the database.
 * Handles: classification → feedback update → theme creation/reuse → FeedbackTheme association.
 *
 * This module should NEVER be imported into "use client" components.
 */

import { db } from "@/lib/db";
import { classifyFeedback } from "./classify";
import type { ClassificationResult } from "./types";

// ── Theme Color Palette ───────────────────────
// Deterministic color assignment for new themes.
// Reuses the same palette as the dashboard ThemesChart.
const THEME_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#64748b",
  "#a855f7",
  "#f43f5e",
  "#0ea5e9",
  "#84a98c",
];

/**
 * Classify a feedback record and persist all results to the database.
 *
 * This is designed to be called asynchronously after feedback creation.
 * If classification fails, the original feedback is left unchanged.
 *
 * Steps:
 * 1. Call Claude via classifyFeedback()
 * 2. Update Feedback with sentiment, sentimentScore, urgency, shortSummary
 * 3. For each classified theme:
 *    a. Normalize name (trim, consistent casing)
 *    b. Find existing Theme in the workspace
 *    c. Create if not found (with deterministic color)
 *    d. Create FeedbackTheme association (idempotent)
 *
 * @param feedbackId - The feedback record to classify
 * @param content - The feedback text content
 * @param workspaceId - The authenticated user's workspaceId
 */
export async function classifyAndPersist(
  feedbackId: string,
  content: string,
  workspaceId: string
): Promise<void> {
  // 1. Classify via Claude
  const classification = await classifyFeedback(content);

  // 2. Update feedback record + handle themes in a transaction
  await db.$transaction(async (tx) => {
    // Update feedback with classification results
    await tx.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        confidence: classification.confidence,
        urgency: classification.urgency,
        shortSummary: classification.shortSummary,
      },
    });

    // Process each theme
    for (const themeResult of classification.themes) {
      const normalizedName = normalizeThemeName(themeResult.name);

      // Find existing theme in this workspace
      let theme = await tx.theme.findUnique({
        where: {
          workspaceId_name: {
            workspaceId,
            name: normalizedName,
          },
        },
      });

      // Create theme if it doesn't exist
      if (!theme) {
        // Determine color: use next available from palette, or fallback
        const existingThemeCount = await tx.theme.count({
          where: { workspaceId },
        });
        const color =
          THEME_COLORS[existingThemeCount % THEME_COLORS.length];

        theme = await tx.theme.create({
          data: {
            workspaceId,
            name: normalizedName,
            color,
          },
        });
      }

      // Create FeedbackTheme association (idempotent — upsert)
      await tx.feedbackTheme.upsert({
        where: {
          feedbackId_themeId: {
            feedbackId,
            themeId: theme.id,
          },
        },
        update: {
          confidence: themeResult.confidence,
        },
        create: {
          feedbackId,
          themeId: theme.id,
          confidence: themeResult.confidence,
        },
      });
    }
  });
}

/**
 * Fire-and-forget wrapper for classifyAndPersist.
 * Catches all errors and logs them server-side.
 * Never throws — safe to call from async contexts without awaiting.
 *
 * @param feedbackId - The feedback record to classify
 * @param content - The feedback text content
 * @param workspaceId - The authenticated user's workspaceId
 */
export async function classifyAndPersistSafe(
  feedbackId: string,
  content: string,
  workspaceId: string
): Promise<void> {
  try {
    await classifyAndPersist(feedbackId, content, workspaceId);
  } catch (error) {
    // Log controlled server-side error — never expose to client
    console.error(
      `[AI Classification] Failed for feedback ${feedbackId}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// ── Re-classification ───────────────────────

/**
 * Re-classify an existing feedback record, replacing old theme associations.
 *
 * Unlike classifyAndPersist (which upserts themes), this function:
 * 1. Deletes ALL existing FeedbackTheme associations for this feedback
 * 2. Re-runs classification via Claude
 * 3. Persists new classification results
 * 4. Creates fresh FeedbackTheme associations from the new classification
 *
 * This ensures that if Claude produces a different theme set on re-classification,
 * stale themes are not accumulated.
 *
 * @param feedbackId - The feedback record to reclassify
 * @param content - The feedback text content
 * @param workspaceId - The authenticated user's workspaceId
 * @returns The classification result if successful, null if classification failed
 */
export async function reclassifyAndPersist(
  feedbackId: string,
  content: string,
  workspaceId: string
): Promise<ClassificationResult | null> {
  // 1. Classify via Claude
  const classification = await classifyFeedback(content);

  // 2. In a transaction: delete old associations, update feedback, create new associations
  await db.$transaction(async (tx) => {
    // Delete all existing FeedbackTheme associations for this feedback
    await tx.feedbackTheme.deleteMany({
      where: { feedbackId },
    });

    // Update feedback with new classification results
    await tx.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        urgency: classification.urgency,
        shortSummary: classification.shortSummary,
      },
    });

    // Process each new theme
    for (const themeResult of classification.themes) {
      const normalizedName = normalizeThemeName(themeResult.name);

      // Find existing theme in this workspace
      let theme = await tx.theme.findUnique({
        where: {
          workspaceId_name: {
            workspaceId,
            name: normalizedName,
          },
        },
      });

      // Create theme if it doesn't exist
      if (!theme) {
        const existingThemeCount = await tx.theme.count({
          where: { workspaceId },
        });
        const color =
          THEME_COLORS[existingThemeCount % THEME_COLORS.length];

        theme = await tx.theme.create({
          data: {
            workspaceId,
            name: normalizedName,
            color,
          },
        });
      }

      // Create FeedbackTheme association
      await tx.feedbackTheme.upsert({
        where: {
          feedbackId_themeId: {
            feedbackId,
            themeId: theme.id,
          },
        },
        update: {
          confidence: themeResult.confidence,
        },
        create: {
          feedbackId,
          themeId: theme.id,
          confidence: themeResult.confidence,
        },
      });
    }
  });

  return classification;
}

// ── Batch Classification ──────────────────────

/** Max concurrent Claude API calls */
const BATCH_CONCURRENCY = 5;

/** Delay between batches to respect rate limits */
const BATCH_DELAY_MS = 200;

/**
 * Classify multiple feedback records with bounded concurrency.
 * Each record is classified independently — one failure does not stop others.
 * 
 * Designed for CSV import where many records need classification.
 * Processes records in batches of BATCH_CONCURRENCY with a small delay between batches.
 *
 * @param records - Array of { id, content } to classify
 * @param workspaceId - The authenticated user's workspaceId
 * @returns Number of successfully classified records
 */
export async function classifyBatch(
  records: Array<{ id: string; content: string }>,
  workspaceId: string
): Promise<{ classified: number; failed: number }> {
  let classified = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < records.length; i += BATCH_CONCURRENCY) {
    const batch = records.slice(i, i + BATCH_CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map((record) => classifyAndPersist(record.id, record.content, workspaceId))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        classified++;
      } else {
        failed++;
        console.error(
          `[AI Batch Classification] Record failed:`,
          result.reason instanceof Error ? result.reason.message : "Unknown error"
        );
      }
    }

    // Delay between batches (except after the last batch)
    if (i + BATCH_CONCURRENCY < records.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return { classified, failed };
}

// ── Helpers ───────────────────────────────────

/**
 * Normalize a theme name for consistent lookup.
 * Trims whitespace, collapses multiple spaces, title-cases.
 *
 * Examples:
 *   " customer support " → "Customer Support"
 *   "PRICING" → "Pricing"
 *   "  ui/ux  " → "Ui/Ux"
 */
function normalizeThemeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      // Preserve all-caps words (like "UI/UX", "API") as-is
      if (word === word.toUpperCase() && word.length > 1) {
        return word;
      }
      // Title case: first letter uppercase, rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
