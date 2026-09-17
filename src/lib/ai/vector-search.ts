/**
 * Project LOOP — Vector Similarity Search
 *
 * Server-side semantic search over feedback embeddings.
 * Uses pgvector cosine similarity to find relevant feedback.
 * All queries are workspace-scoped for multi-tenant isolation.
 *
 * This file should NEVER be imported into "use client" components.
 */

import { db } from "@/lib/db";
import { EMBEDDING_DIMENSION } from "./embeddings";

// ── Diagnostic Logging ────────────────────────
// Logs workspace-level counts for production debugging.
// Never logs PII, full feedback content, or API keys.

async function logWorkspaceStats(workspaceId: string): Promise<void> {
  try {
    const [feedbackCount, embeddingCount] = await Promise.all([
      db.feedback.count({ where: { workspaceId } }),
      db.embedding.count({ where: { feedback: { workspaceId } } }),
    ]);
    console.log(
      `[Ask LOOP] Workspace stats — feedbackCount=${feedbackCount}, embeddingCount=${embeddingCount}, workspaceId=${workspaceId.substring(0, 8)}...`
    );
  } catch (e) {
    // Non-fatal — don't block the search
    console.warn("[Ask LOOP] Failed to fetch workspace stats for logging:", e instanceof Error ? e.message : e);
  }
}

// ── Types ─────────────────────────────────────

export interface SearchResult {
  feedbackId: string;
  content: string;
  channel: string;
  sentiment: string;
  status: string;
  createdAt: Date;
  similarity: number;
  themes?: Array<{
    theme: { id: string; name: string; color: string };
    confidence: number;
  }>;
}

// ── Helpers ───────────────────────────────────

/**
 * Convert a number array to pgvector bracket notation.
 *
 * Prisma's $queryRaw serializes JS arrays as PostgreSQL text arrays
 * ("0.1","0.1",...) which pgvector rejects with code 22P02.
 * pgvector expects bracket notation: [0.1,0.1,...]
 *
 * This function produces a safe string for use as a parameterized value.
 */
export function toPgVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

// ── Vector Search ─────────────────────────────

/**
 * Perform semantic similarity search over feedback embeddings.
 *
 * This function:
 * 1. Validates the query embedding dimension
 * 2. Converts embedding to pgvector-compatible bracket notation
 * 3. Uses pgvector cosine similarity to find similar feedback
 * 4. Enforces workspace isolation (critical for multi-tenant security)
 * 5. Returns feedback records with similarity scores
 * 6. Optionally filters by sentiment, status, or date range
 *
 * @param queryEmbedding - The embedding vector to search against
 * @param workspaceId - The workspace to search within (mandatory for isolation)
 * @param limit - Maximum number of results to return (default: 10)
 * @param filters - Optional filters for sentiment, status, date range
 * @returns Array of search results with similarity scores
 * @throws Error if query embedding dimension is incorrect
 */
export async function searchSimilarFeedback(
  queryEmbedding: number[],
  workspaceId: string,
  limit: number = 10,
  filters?: {
    sentiment?: "POS" | "NEU" | "NEG";
    status?: "NEW" | "REVIEWED" | "ACTIONED";
    dateFrom?: Date;
    dateTo?: Date;
  }
): Promise<SearchResult[]> {
  // 1. Validate embedding dimension
  if (queryEmbedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Query embedding dimension ${queryEmbedding.length} does not match expected ${EMBEDDING_DIMENSION}`
    );
  }

  // 2. Validate limit
  if (limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100");
  }

  // 3. Convert embedding to pgvector bracket notation for Prisma compatibility
  // Prisma serializes JS arrays as {"0.1","0.1"} which pgvector rejects.
  // Bracket notation [0.1,0.1] is the correct pgvector input format.
  // Safe to interpolate directly: server-generated numeric-only string.
  const vectorLiteral = toPgVectorLiteral(queryEmbedding);

  // 4. Build WHERE conditions dynamically
  // IMPORTANT: Cannot use nested db.$queryRaw`` for optional filters because
  // Prisma creates parameter placeholders ($N) for ALL interpolated values
  // including empty tagged templates, causing "syntax error at or near $3".
  // Instead, build a parameterized array and use $queryRawUnsafe.
  const conditions: string[] = [`f."workspaceId" = $1`];
  const params: unknown[] = [workspaceId];
  let paramIndex = 2;

  if (filters?.sentiment) {
    conditions.push(`f.sentiment = $${paramIndex++}`);
    params.push(filters.sentiment);
  }
  if (filters?.status) {
    conditions.push(`f.status = $${paramIndex++}`);
    params.push(filters.status);
  }
  if (filters?.dateFrom) {
    conditions.push(`f."createdAt" >= $${paramIndex++}`);
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    conditions.push(`f."createdAt" <= $${paramIndex++}`);
    params.push(filters.dateTo);
  }

  // FIX: must join with " AND " — the original code used ", \\n        " which
  // produced a comma-separated list ("a = $1, b = $2") causing PostgreSQL
  // syntax error: column "b" does not exist in a FROM clause context.
  const whereClause = conditions.join(" AND ");

  // 5. Build and execute the full query
  // The vector literal is server-generated (safe), workspaceId and filters are parameterized.
  const sql = `
    WITH similarity AS (
      SELECT
        e."feedbackId",
        (1 - (e.vector <=> '${vectorLiteral}'::vector)) as similarity
      FROM "Embedding" e
      WHERE e."feedbackId" IN (
        SELECT f.id FROM "Feedback" f
        WHERE ${whereClause}
      )
      ORDER BY similarity DESC
      LIMIT ${limit}
    )
    SELECT
      f.id as "feedbackId",
      f.content,
      f.channel,
      f.sentiment,
      f.status,
      f."createdAt",
      s.similarity,
      COALESCE(
        json_agg(
          json_build_object(
            'theme', json_build_object(
              'id', t.id,
              'name', t.name,
              'color', t.color
            ),
            'confidence', ft.confidence
          )
          ORDER BY ft.confidence DESC
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) as themes
    FROM similarity s
    JOIN "Feedback" f ON f.id = s."feedbackId"
    LEFT JOIN "FeedbackTheme" ft ON ft."feedbackId" = f.id
    LEFT JOIN "Theme" t ON t.id = ft."themeId"
    GROUP BY f.id, f.content, f.channel, f.sentiment, f.status, f."createdAt", s.similarity
    ORDER BY s.similarity DESC
  `;

  // $queryRawUnsafe needed because Prisma tagged templates create
  // parameter placeholders for ALL interpolated values including empty
  // templates, causing SQL syntax errors with optional filter conditions.
  // eslint-disable-next-line
  const rawQuery = (
    db as unknown as Record<string, (...args: unknown[]) => Promise<unknown[]>>
  ).$queryRawUnsafe;

  // Log workspace stats before executing (non-blocking)
  await logWorkspaceStats(workspaceId);

  const rawResults = await rawQuery.call(db, sql, ...params) as SearchResult[];

  // A feedback record is the unit of evidence. Keep the first result for each
  // ID (the query is ordered by similarity) while preserving distinct records
  // that happen to contain identical text.
  const seenFeedbackIds = new Set<string>();
  const results = rawResults.filter((result) => {
    if (seenFeedbackIds.has(result.feedbackId)) {
      return false;
    }

    seenFeedbackIds.add(result.feedbackId);
    return true;
  });

  console.log(
    `[Ask LOOP] Vector search returned ${results.length} unique result(s) for workspaceId=${workspaceId.substring(0, 8)}...`
  );

  return results;
}

/**
 * Check if a feedback record has an embedding.
 *
 * @param feedbackId - The feedback record ID
 * @param workspaceId - The workspace ID (for isolation)
 * @returns True if embedding exists, false otherwise
 */
export async function hasEmbedding(
  feedbackId: string,
  workspaceId: string
): Promise<boolean> {
  const embedding = await db.embedding.findFirst({
    where: {
      feedbackId,
      feedback: {
        workspaceId,
      },
    },
  });

  return embedding !== null;
}

/**
 * Count feedback records without embeddings in a workspace.
 *
 * @param workspaceId - The workspace ID
 * @returns Number of feedback records without embeddings
 */
export async function countFeedbackWithoutEmbeddings(
  workspaceId: string
): Promise<number> {
  const count = await db.feedback.count({
    where: {
      workspaceId,
      embedding: null,
    },
  });

  return count;
}

/**
 * Get feedback records without embeddings for backfill.
 *
 * @param workspaceId - The workspace ID
 * @param limit - Maximum number of records to return
 * @returns Array of feedback records without embeddings
 */
export async function getFeedbackWithoutEmbeddings(
  workspaceId: string,
  limit: number = 100
): Promise<Array<{ id: string; content: string }>> {
  const feedback = await db.feedback.findMany({
    where: {
      workspaceId,
      embedding: null,
    },
    select: {
      id: true,
      content: true,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  return feedback;
}
