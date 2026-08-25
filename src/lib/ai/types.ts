/**
 * Project LOOP — AI Classification Types
 *
 * Strongly typed classification results for Claude AI feedback analysis.
 * These types represent the structured output expected from Claude.
 */

// ── Theme Classification ──────────────────────

export interface ThemeClassification {
  /** Concise, reusable theme name (e.g. "Customer Support", "Pricing") */
  name: string;
  /** Confidence score for this theme (0 to 1) */
  confidence: number;
}

// ── Classification Result ──────────────────────

export interface ClassificationResult {
  /** Sentiment label: POS (positive), NEU (neutral), NEG (negative) */
  sentiment: "POS" | "NEU" | "NEG";

  /** Sentiment score from -1.0 (very negative) to 1.0 (very positive) */
  sentimentScore: number;

  /** Identified themes with confidence scores */
  themes: ThemeClassification[];

  /** Urgency level: LOW, MEDIUM, HIGH, CRITICAL */
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  /** Overall classification confidence (0 to 1) */
  confidence: number;

  /** Brief summary of the feedback (max 500 characters) */
  shortSummary: string;
}

// ── Input Types ───────────────────────────────

export interface ClassifyInput {
  /** The feedback content to classify */
  content: string;
}

// ── Error Types ───────────────────────────────

export type ClassificationErrorCode =
  | "MISSING_API_KEY"
  | "CLAUDE_API_ERROR"
  | "MALFORMED_RESPONSE"
  | "SCHEMA_VALIDATION_ERROR"
  | "INVALID_INPUT";

export interface ClassificationError {
  code: ClassificationErrorCode;
  message: string;
  details?: unknown;
}
