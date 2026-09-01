import { z } from "zod";

// -- Request validation -----------------------------------------------------

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date format")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Invalid calendar date");

export const generateReportRequestSchema = z
  .object({
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
  })
  .superRefine((value, ctx) => {
    if (startOfUtcDay(value.startDate) > endOfUtcDay(value.endDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after start date",
      });
    }
  });

export const reportListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export type GenerateReportRequestInput = z.infer<
  typeof generateReportRequestSchema
>;

export function normalizeReportDateRange(input: GenerateReportRequestInput) {
  return {
    periodStart: startOfUtcDay(input.startDate),
    periodEnd: endOfUtcDay(input.endDate),
  };
}

function startOfUtcDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function endOfUtcDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

// -- Stored report content validation --------------------------------------

export const sentimentSummarySchema = z.object({
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
});

export const reportThemeSchema = z.object({
  themeId: z.string(),
  name: z.string().min(1).max(100),
  color: z.string().nullable(),
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
});

export const reportFeedbackReferenceSchema = z.object({
  feedbackId: z.string(),
  content: z.string().min(1).max(600),
  channel: z.string().min(1).max(100),
  customerLabel: z.string().nullable(),
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  sentimentScore: z.number().min(-1).max(1),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  shortSummary: z.string().nullable(),
  createdAt: z.string().datetime(),
  themes: z.array(
    z.object({
      themeId: z.string(),
      name: z.string().min(1).max(100),
      color: z.string().nullable(),
      confidence: z.number().min(0).max(1),
    })
  ),
});

export const reportQuoteSchema = z.object({
  feedbackId: z.string(),
  quote: z.string().min(1).max(360),
  isTruncated: z.boolean(),
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  sentimentScore: z.number().min(-1).max(1),
  channel: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
});

export const reportNarrativeSchema = z.object({
  executiveSummary: z.string().min(1).max(1800),
  sections: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(1400),
      })
    )
    .min(2)
    .max(6),
  recommendedActions: z
    .array(
      z.object({
        title: z.string().min(1).max(140),
        rationale: z.string().min(1).max(800),
        priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
        evidenceIds: z.array(z.string()).max(8),
      })
    )
    .min(1)
    .max(6),
});

export const voiceOfCustomerReportContentSchema = z.object({
  schemaVersion: z.literal(1),
  reportType: z.literal("VOICE_OF_CUSTOMER"),
  title: z.string().min(1).max(180),
  generatedAt: z.string().datetime(),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    label: z.string().min(1).max(120),
  }),
  statistics: z.object({
    totalFeedback: z.number().int().min(0),
    sentimentDistribution: z.object({
      POS: sentimentSummarySchema,
      NEU: sentimentSummarySchema,
      NEG: sentimentSummarySchema,
    }),
    averageSentimentScore: z.number().min(-1).max(1).nullable(),
    sentimentScoreSampleSize: z.number().int().min(0),
    topThemes: z.array(reportThemeSchema).max(10),
  }),
  evidence: z.object({
    representativeFeedback: z.array(reportFeedbackReferenceSchema).max(8),
    notableQuotes: z.array(reportQuoteSchema).max(6),
  }),
  narrative: reportNarrativeSchema,
  exportMeta: z.object({
    formatVersion: z.literal(1),
    sectionOrder: z.array(z.string().min(1)),
  }),
});

export type ReportNarrative = z.infer<typeof reportNarrativeSchema>;
export type VoiceOfCustomerReportContent = z.infer<
  typeof voiceOfCustomerReportContentSchema
>;
