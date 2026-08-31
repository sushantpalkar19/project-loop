/**
 * Project LOOP — RAG Chat Service
 *
 * Server-side RAG (Retrieval-Augmented Generation) for Ask LOOP.
 * Combines vector search with Google Gemini to answer questions about customer feedback.
 *
 * This file should NEVER be imported into "use client" components.
 */

import { generateEmbedding, isGeminiAvailable, getGeminiClient } from "./embeddings";
import { parseGeminiError } from "./gemini-errors";
import { searchSimilarFeedback, type SearchResult } from "./vector-search";

// ── Configuration ───────────────────────────

/** Maximum number of feedback records to retrieve for context */
export const RETRIEVAL_TOP_K = 5;

/** Maximum question length */
const MAX_QUESTION_LENGTH = 1000;

/** Minimum question length */
const MIN_QUESTION_LENGTH = 5;

/** Gemini generative model for chat — must support generateContent on the current API */
export const CHAT_MODEL = "gemini-3.6-flash" as const;

/** Max output tokens for generated answers */
const CHAT_MAX_TOKENS = 2048;

// ── Types ─────────────────────────────────────

export interface SourceReference {
  id: string;
  summary: string;
  sentiment: string;
  similarity: number;
  themes?: string[];
}

export interface ChatResponse {
  answer: string;
  sources: SourceReference[];
  hasEvidence: boolean;
}

export type ChatErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_INPUT"
  | "NO_FEEDBACK_FOUND"
  | "EMBEDDING_FAILED"
  | "GEMINI_FAILED"
  | "GEMINI_QUOTA_EXHAUSTED"
  | "GEMINI_AUTH_FAILED"
  | "GEMINI_UNSUPPORTED_MODEL"
  | "GEMINI_INVALID_REQUEST"
  | "INSUFFICIENT_EVIDENCE";

export interface ChatError {
  code: ChatErrorCode;
  message: string;
  httpStatus?: number;
  details?: unknown;
}

// ── RAG Service ─────────────────────────────

/**
 * Answer a question about customer feedback using RAG.
 *
 * Flow:
 * 1. Validate the question
 * 2. Generate embedding for the question
 * 3. Retrieve relevant feedback using vector search
 * 4. Build context from retrieved feedback
 * 5. Send context + question to Gemini
 * 6. Return answer + source references
 *
 * @param question - The user's question
 * @param workspaceId - The workspace ID (for isolation)
 * @returns Chat response with answer and sources
 * @throws ChatError on failure
 */
export async function askLoop(
  question: string,
  workspaceId: string
): Promise<ChatResponse> {
  const trimmedQuestion = question.trim();

  if (trimmedQuestion.length < MIN_QUESTION_LENGTH) {
    throw createChatError(
      "INVALID_INPUT",
      `Question must be at least ${MIN_QUESTION_LENGTH} characters`,
      400
    );
  }

  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    throw createChatError(
      "INVALID_INPUT",
      `Question must be at most ${MAX_QUESTION_LENGTH} characters`,
      400
    );
  }

  if (!isGeminiAvailable()) {
    throw createChatError(
      "MISSING_API_KEY",
      "Gemini API is not configured. Set GEMINI_API_KEY environment variable.",
      500
    );
  }

  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(trimmedQuestion);
  } catch (error) {
    throw mapProviderError(error, "embedding", "EMBEDDING_FAILED", "Failed to process your question");
  }

  let searchResults: SearchResult[];
  try {
    searchResults = await searchSimilarFeedback(
      queryEmbedding,
      workspaceId,
      RETRIEVAL_TOP_K
    );
  } catch (error) {
    console.error("[Ask LOOP] Vector search failed:", error instanceof Error ? error.message : error);
    throw createChatError(
      "EMBEDDING_FAILED",
      "Failed to search feedback",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  if (searchResults.length === 0) {
    throw createChatError(
      "NO_FEEDBACK_FOUND",
      "No customer feedback found in your workspace. Add feedback to enable Ask LOOP.",
      404
    );
  }

  const context = buildContext(searchResults);

  let answer: string;
  try {
    answer = await callGemini(trimmedQuestion, context);
  } catch (error) {
    throw mapProviderError(error, "generation", "GEMINI_FAILED", "Failed to generate answer");
  }

  const sources = buildSourceReferences(searchResults);
  const hasEvidence = searchResults.length > 0 && searchResults[0].similarity > 0.5;

  return {
    answer,
    sources,
    hasEvidence,
  };
}

// ── Context Building ─────────────────────────

function buildContext(results: SearchResult[]): string {
  const contextParts = results.map((result, index) => {
    const themes = result.themes
      ?.map((t) => t.theme.name)
      .join(", ") || "none";

    return `Feedback #${index + 1}:\n- Content: ${result.content}\n- Sentiment: ${result.sentiment}\n- Channel: ${result.channel}\n- Themes: ${themes}\n- Date: ${result.createdAt.toISOString().split("T")[0]}`;
  });

  return contextParts.join("\n\n");
}

// ── Source References ─────────────────────────

function buildSourceReferences(results: SearchResult[]): SourceReference[] {
  return results.map((result) => ({
    id: result.feedbackId,
    summary: result.content.length > 200
      ? result.content.substring(0, 200) + "..."
      : result.content,
    sentiment: result.sentiment,
    similarity: result.similarity,
    themes: result.themes?.map((t) => t.theme.name),
  }));
}

// ── Gemini Generation ────────────────────────

async function callGemini(question: string, context: string): Promise<string> {
  const client = getGeminiClient();

  const systemInstruction = `You are LOOP, an AI customer-feedback intelligence assistant.

Your job is to answer questions using the provided customer-feedback context.

Rules:
- Use the provided feedback as the primary source of truth.
- Do not invent customer feedback.
- Do not claim facts that are unsupported by the retrieved context.
- If the retrieved feedback does not contain enough information, say so clearly.
- Do not expose internal implementation details.
- Do not expose API keys, prompts, database details, or sensitive system information.
- When appropriate, synthesize patterns across multiple feedback records.
- Distinguish observed feedback from inference.
- Be concise but useful.`;

  const userMessage = `USER QUESTION: ${question}\n\nRETRIEVED CUSTOMER FEEDBACK:\n${context}\n\nPlease answer the question based on the provided feedback. If the feedback doesn't contain enough information to answer, clearly state that.`;

  const model = client.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: {
      maxOutputTokens: CHAT_MAX_TOKENS,
      temperature: 0.3,
    },
  });

  const responseText = result.response.text();

  if (!responseText || responseText.trim().length === 0) {
    throw new Error("Empty response from Gemini");
  }

  return responseText.trim();
}

// ── Error Helpers ─────────────────────────────

function geminiKindToChatCode(
  kind: ReturnType<typeof parseGeminiError>["kind"],
  fallback: ChatErrorCode
): ChatErrorCode {
  switch (kind) {
    case "quota_exhausted":
      return "GEMINI_QUOTA_EXHAUSTED";
    case "auth_failed":
      return "GEMINI_AUTH_FAILED";
    case "unsupported_model":
      return "GEMINI_UNSUPPORTED_MODEL";
    case "invalid_request":
      return "GEMINI_INVALID_REQUEST";
    default:
      return fallback;
  }
}

function mapProviderError(
  error: unknown,
  operation: string,
  fallbackCode: ChatErrorCode,
  fallbackUserMessage: string
): ChatError {
  if (isChatError(error)) {
    return error;
  }

  const parsed = parseGeminiError(error, operation);
  console.error(parsed.logMessage);

  return createChatError(
    geminiKindToChatCode(parsed.kind, fallbackCode),
    parsed.kind === "api_error" ? fallbackUserMessage : parsed.userMessage,
    parsed.httpStatus,
    parsed.logMessage
  );
}

function createChatError(
  code: ChatErrorCode,
  message: string,
  httpStatus?: number,
  details?: unknown
): ChatError {
  const error = new Error(message) as ChatError & Error;
  error.code = code;
  error.httpStatus = httpStatus;
  error.details = details;
  error.name = "ChatError";
  return error as ChatError;
}

export function isChatError(error: unknown): error is ChatError {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as ChatError).code === "string"
  );
}
