/**
 * Project LOOP — Gemini API Error Parsing
 *
 * Maps @google/generative-ai errors to safe user messages and HTTP statuses.
 * Never logs or exposes API keys or sensitive data.
 */

import { GoogleGenerativeAIFetchError } from "@google/generative-ai";

export type GeminiErrorKind =
  | "quota_exhausted"
  | "auth_failed"
  | "unsupported_model"
  | "invalid_request"
  | "api_error";

export interface ParsedGeminiError {
  kind: GeminiErrorKind;
  httpStatus: number;
  userMessage: string;
  logMessage: string;
}

function extractErrorText(error: unknown): {
  message: string;
  status?: number;
  statusText?: string;
} {
  if (error instanceof GoogleGenerativeAIFetchError) {
    const detailText =
      error.errorDetails
        ?.map((detail) => {
          if (typeof detail === "object" && detail !== null && "message" in detail) {
            return String((detail as { message?: string }).message ?? "");
          }
          return "";
        })
        .filter(Boolean)
        .join("; ") ?? "";

    const message = [error.message, detailText].filter(Boolean).join(" — ");
    return { message, status: error.status, statusText: error.statusText };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: String(error) };
}

function isQuotaExhausted(status: number | undefined, message: string): boolean {
  if (status === 429) {
    return true;
  }

  const lower = message.toLowerCase();
  return (
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  );
}

/**
 * Parse a Gemini SDK or fetch error into a structured, safe response.
 */
export function parseGeminiError(error: unknown, operation: string): ParsedGeminiError {
  const { message, status, statusText } = extractErrorText(error);
  const logMessage = `[Gemini ${operation}] ${status ?? "unknown"} ${statusText ?? ""}: ${message}`.trim();

  if (isQuotaExhausted(status, message)) {
    return {
      kind: "quota_exhausted",
      httpStatus: 429,
      userMessage:
        "Gemini usage quota is currently exhausted. Please try again after the quota resets.",
      logMessage,
    };
  }

  if (status === 404) {
    return {
      kind: "unsupported_model",
      httpStatus: 502,
      userMessage:
        "The configured Gemini model is not available. Please contact your administrator.",
      logMessage,
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: "auth_failed",
      httpStatus: 503,
      userMessage:
        "Gemini API authentication failed. Please contact your administrator.",
      logMessage,
    };
  }

  if (status === 400) {
    return {
      kind: "invalid_request",
      httpStatus: 502,
      userMessage: "The AI service received an invalid request. Please try again.",
      logMessage,
    };
  }

  return {
    kind: "api_error",
    httpStatus: 502,
    userMessage: "The AI service is temporarily unavailable. Please try again later.",
    logMessage,
  };
}
