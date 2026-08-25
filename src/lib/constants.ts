// ──────────────────────────────────────────────
// Project LOOP — Shared Feedback Constants
//
// Single source of truth for channel, sentiment,
// and status values used across API routes,
// UI components, seed scripts, and validations.
// ──────────────────────────────────────────────

// ── Channels ──────────────────────────────────

export const FEEDBACK_CHANNELS = [
  "email",
  "survey",
  "social",
  "api",
  "manual",
  "chat",
] as const;

export type FeedbackChannel = (typeof FEEDBACK_CHANNELS)[number];

// ── Sentiments ────────────────────────────────

export const SENTIMENTS = ["POS", "NEU", "NEG"] as const;

export type SentimentValue = (typeof SENTIMENTS)[number];

// ── Feedback Status ───────────────────────────

export const FEEDBACK_STATUSES = ["NEW", "REVIEWED", "ACTIONED"] as const;

export type FeedbackStatusValue = (typeof FEEDBACK_STATUSES)[number];

// ── Display Labels ────────────────────────────

export const SENTIMENT_LABELS: Record<SentimentValue, string> = {
  POS: "Positive",
  NEU: "Neutral",
  NEG: "Negative",
};

export const STATUS_LABELS: Record<FeedbackStatusValue, string> = {
  NEW: "New",
  REVIEWED: "Reviewed",
  ACTIONED: "Actioned",
};
