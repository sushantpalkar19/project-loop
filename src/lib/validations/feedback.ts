import { z } from "zod";

// ── Create Feedback ───────────────────────────

export const createFeedbackSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000),
  channel: z.string().min(1, "Channel is required").max(100),
  sourceRef: z.string().max(255).optional(),
  customerLabel: z.string().max(255).optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

// ── Update Feedback ───────────────────────────

export const updateFeedbackSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  channel: z.string().min(1).max(100).optional(),
  sourceRef: z.string().max(255).optional().nullable(),
  customerLabel: z.string().max(255).optional().nullable(),
  status: z.enum(["NEW", "REVIEWED", "ACTIONED"]).optional(),
});

export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;

// ── Query Parameters ──────────────────────────

export const feedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  channel: z.string().max(100).optional(),
  sentiment: z.enum(["POS", "NEU", "NEG"]).optional(),
  status: z.enum(["NEW", "REVIEWED", "ACTIONED"]).optional(),
  themeId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type FeedbackQueryInput = z.infer<typeof feedbackQuerySchema>;
