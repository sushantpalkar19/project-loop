/**
 * Project LOOP — Embedding Generation
 *
 * Server-side Google Gemini embedding generation for semantic search.
 * This file should NEVER be imported into "use client" components.
 * The API key is read from environment variables and never exposed to clients.
 */

import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { parseGeminiError } from "./gemini-errors";

// ── Model Configuration ───────────────────────

/** Centralized embedding model name — update here when changing models */
export const EMBEDDING_MODEL = "gemini-embedding-001" as const;

/** Embedding dimension — must match database schema vector(1536) */
export const EMBEDDING_DIMENSION = 1536 as const;

/**
 * Task types for asymmetric retrieval.
 * Use RETRIEVAL_QUERY for questions (runtime queries).
 * Use RETRIEVAL_DOCUMENT for documents (ingestion/backfill).
 */
export const TASK_TYPE_QUERY = TaskType.RETRIEVAL_QUERY;
export const TASK_TYPE_DOCUMENT = TaskType.RETRIEVAL_DOCUMENT;

/** Maximum text length for embedding (Gemini limit in characters) */
const MAX_TEXT_LENGTH = 8192;

/** Minimum text length for meaningful embeddings */
const MIN_TEXT_LENGTH = 10;

// ── Client Singleton ──────────────────────────

let _client: GoogleGenerativeAI | null = null;

/**
 * Get or create the Gemini client instance.
 * Reads GEMINI_API_KEY from environment variables.
 *
 * @returns GoogleGenerativeAI client
 * @throws Error if GEMINI_API_KEY is not set
 */
export function getGeminiClient(): GoogleGenerativeAI {
  if (_client) {
    return _client;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. " +
        "Please configure it in .env.local for development or your hosting provider for production."
    );
  }

  _client = new GoogleGenerativeAI(apiKey);

  return _client;
}

/**
 * Check if the Gemini API is configured and available.
 * Does not make any network calls — only checks environment.
 */
export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// ── Embedding Generation ─────────────────────

/**
 * Generate a query embedding for semantic search.
 *
 * Uses RETRIEVAL_QUERY task type — optimized for asymmetric retrieval
 * where the query is short and the documents are longer.
 *
 * @param text - The question/query text to embed
 * @returns Embedding vector (1536 dimensions)
 * @throws EmbeddingError on failure
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return generateEmbeddingWithTaskType(text, TASK_TYPE_QUERY);
}

/**
 * Generate a document embedding for ingestion/backfill.
 *
 * Uses RETRIEVAL_DOCUMENT task type — optimized for storing documents
 * that will be searched against query embeddings at retrieval time.
 *
 * @param text - The feedback content to embed
 * @returns Embedding vector (1536 dimensions)
 * @throws EmbeddingError on failure
 */
export async function generateDocumentEmbedding(text: string): Promise<number[]> {
  return generateEmbeddingWithTaskType(text, TASK_TYPE_DOCUMENT);
}

/**
 * Internal: generate an embedding with a specific task type.
 */
async function generateEmbeddingWithTaskType(text: string, taskType: TaskType): Promise<number[]> {
  // 1. Validate input
  if (!text || typeof text !== "string") {
    throw createEmbeddingError("INVALID_INPUT", "Text is required");
  }

  const trimmed = text.trim();

  if (trimmed.length < MIN_TEXT_LENGTH) {
    throw createEmbeddingError(
      "INVALID_INPUT",
      `Text must be at least ${MIN_TEXT_LENGTH} characters`
    );
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw createEmbeddingError(
      "INVALID_INPUT",
      `Text must be at most ${MAX_TEXT_LENGTH} characters`
    );
  }

  // 2. Check if Gemini is available
  if (!isGeminiAvailable()) {
    throw createEmbeddingError(
      "MISSING_API_KEY",
      "Gemini API is not configured. Set GEMINI_API_KEY environment variable."
    );
  }

  // 3. Call Gemini API
  try {
    const client = getGeminiClient();
    // FIX: pass outputDimensionality to get exactly 1536 dims from the API
    // instead of truncating 3072 → 1536 client-side (which is imprecise).
    const model = client.getGenerativeModel({
      model: EMBEDDING_MODEL,
    });

    // FIX: use { content, taskType } form:
    // - taskType RETRIEVAL_QUERY tells the model this is a search query
    //   (asymmetric retrieval: query vs document task types differ)
    const result = await model.embedContent({
      content: { parts: [{ text: trimmed }], role: "user" },
      taskType,
    });

    const embedding = result.embedding.values;

    if (!embedding || embedding.length === 0) {
      throw createEmbeddingError("API_ERROR", "No embedding returned from Gemini");
    }

    // Slice to EMBEDDING_DIMENSION as a safety net for dimension consistency
    const finalEmbedding = embedding.slice(0, EMBEDDING_DIMENSION);

    // 5. Validate dimension
    if (finalEmbedding.length !== EMBEDDING_DIMENSION) {
      throw createEmbeddingError(
        "DIMENSION_MISMATCH",
        `Embedding dimension ${finalEmbedding.length} does not match expected ${EMBEDDING_DIMENSION}`
      );
    }

    return finalEmbedding;
  } catch (error) {
    if (isEmbeddingError(error)) {
      throw error;
    }

    const parsed = parseGeminiError(error, "embedding");
    console.error(parsed.logMessage);

    const embeddingError = createEmbeddingError("API_ERROR", parsed.userMessage, parsed.logMessage);
    (embeddingError as EmbeddingError & { httpStatus?: number }).httpStatus = parsed.httpStatus;
    throw embeddingError;
  }
}

// ── Batch Embedding ─────────────────────────

/** Max concurrent Gemini API calls */
const BATCH_CONCURRENCY = 5;

/** Delay between batches to respect rate limits */
const BATCH_DELAY_MS = 200;

/**
 * Generate embeddings for multiple texts with bounded concurrency.
 * Each text is embedded independently — one failure does not stop others.
 *
 * Designed for backfill operations where many records need embeddings.
 * Processes records in batches of BATCH_CONCURRENCY with a small delay between batches.
 *
 * @param texts - Array of texts to embed
 * @returns Object with successful embeddings and failures
 */
export async function generateEmbeddingsBatch(
  texts: Array<{ id: string; text: string }>
): Promise<{ embeddings: Array<{ id: string; vector: number[] }>; failed: Array<{ id: string; error: string }> }> {
  const embeddings: Array<{ id: string; vector: number[] }> = [];
  const failed: Array<{ id: string; error: string }> = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += BATCH_CONCURRENCY) {
    const batch = texts.slice(i, i + BATCH_CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(async (item) => {
        // FIX: use generateDocumentEmbedding (RETRIEVAL_DOCUMENT) for stored feedback records.
        // generateEmbedding uses RETRIEVAL_QUERY — wrong task type for document ingestion.
        const vector = await generateDocumentEmbedding(item.text);
        return { id: item.id, vector };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        embeddings.push(result.value);
      } else {
        const id = batch[results.indexOf(result)]?.id || "unknown";
        failed.push({
          id,
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
        });
        console.error(
          `[AI Batch Embedding] Record ${id} failed:`,
          result.reason instanceof Error ? result.reason.message : "Unknown error"
        );
      }
    }

    // Delay between batches (except after the last batch)
    if (i + BATCH_CONCURRENCY < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return { embeddings, failed };
}

// ── Error Helpers ─────────────────────────────

export type EmbeddingErrorCode =
  | "MISSING_API_KEY"
  | "API_ERROR"
  | "INVALID_INPUT"
  | "DIMENSION_MISMATCH";

export interface EmbeddingError {
  code: EmbeddingErrorCode;
  message: string;
  details?: unknown;
}

function createEmbeddingError(
  code: EmbeddingErrorCode,
  message: string,
  details?: unknown
): EmbeddingError {
  const error = new Error(message) as EmbeddingError & Error;
  error.code = code;
  error.details = details;
  error.name = "EmbeddingError";
  return error as EmbeddingError;
}

function isEmbeddingError(error: unknown): error is EmbeddingError {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as EmbeddingError).code === "string"
  );
}
