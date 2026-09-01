/**
 * Project LOOP -- Voice-of-Customer report service.
 *
 * All data access is workspace-scoped by callers that derive workspaceId from
 * the authenticated session. Gemini receives only deterministic report facts.
 */

import { db } from "@/lib/db";
import { generateReportNarrative, isReportNarrativeError } from "@/lib/ai/report";
import {
  voiceOfCustomerReportContentSchema,
  type ReportNarrative,
  type VoiceOfCustomerReportContent,
} from "@/lib/validations/reports";
import type { Prisma } from "@/generated/prisma/client";

const MAX_REPRESENTATIVE_FEEDBACK = 8;
const MAX_NOTABLE_QUOTES = 6;
const MAX_TOP_THEMES = 10;

type SentimentKey = "POS" | "NEU" | "NEG";
type UrgencyKey = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface GenerateReportInput {
  workspaceId: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
}

type FeedbackForReport = {
  id: string;
  content: string;
  channel: string;
  customerLabel: string | null;
  sentiment: SentimentKey;
  sentimentScore: number;
  urgency: UrgencyKey;
  shortSummary: string | null;
  createdAt: Date;
  themes: Array<{
    confidence: number;
    theme: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
};

export type ReportGenerationErrorCode =
  | "NO_FEEDBACK_FOUND"
  | "NARRATIVE_GENERATION_FAILED"
  | "REPORT_VALIDATION_FAILED"
  | "REPORT_SAVE_FAILED";

export interface ReportGenerationError {
  code: ReportGenerationErrorCode;
  message: string;
  httpStatus?: number;
  details?: unknown;
}

export async function listReports(workspaceId: string, limit: number = 25) {
  return db.report.findMany({
    where: { workspaceId },
    select: {
      id: true,
      title: true,
      periodStart: true,
      periodEnd: true,
      contentJson: true,
      createdAt: true,
      generatedBy: true,
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function generateVoiceOfCustomerReport({
  workspaceId,
  userId,
  periodStart,
  periodEnd,
}: GenerateReportInput) {
  const feedback = await db.feedback.findMany({
    where: {
      workspaceId,
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    select: {
      id: true,
      content: true,
      channel: true,
      customerLabel: true,
      sentiment: true,
      sentimentScore: true,
      urgency: true,
      shortSummary: true,
      createdAt: true,
      themes: {
        select: {
          confidence: true,
          theme: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });

  if (feedback.length === 0) {
    throw createReportGenerationError(
      "NO_FEEDBACK_FOUND",
      "No feedback was found in the selected reporting period.",
      400
    );
  }

  const title = buildReportTitle(periodStart, periodEnd);
  const statistics = buildStatistics(feedback);
  const evidence = buildEvidence(feedback);
  const baseContent = {
    schemaVersion: 1,
    reportType: "VOICE_OF_CUSTOMER",
    title,
    generatedAt: new Date().toISOString(),
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
      label: buildPeriodLabel(periodStart, periodEnd),
    },
    statistics,
    evidence,
  } satisfies Omit<VoiceOfCustomerReportContent, "narrative" | "exportMeta">;

  let narrative: ReportNarrative;
  try {
    narrative = await generateReportNarrative({
      period: baseContent.period,
      statistics: baseContent.statistics,
      evidence: baseContent.evidence,
    });
  } catch (error) {
    if (isReportNarrativeError(error)) {
      throw createReportGenerationError(
        "NARRATIVE_GENERATION_FAILED",
        error.message,
        error.httpStatus ?? 502,
        error.details
      );
    }

    throw createReportGenerationError(
      "NARRATIVE_GENERATION_FAILED",
      "Failed to generate the report narrative.",
      502,
      error instanceof Error ? error.message : error
    );
  }

  const content: VoiceOfCustomerReportContent = {
    ...baseContent,
    narrative,
    exportMeta: {
      formatVersion: 1,
      sectionOrder: [
        "executiveSummary",
        "statistics",
        "sentiment",
        "topThemes",
        "representativeFeedback",
        "notableQuotes",
        "recommendedActions",
      ],
    },
  };

  const validation = voiceOfCustomerReportContentSchema.safeParse(content);

  if (!validation.success) {
    throw createReportGenerationError(
      "REPORT_VALIDATION_FAILED",
      "Generated report content failed validation.",
      500,
      validation.error.flatten().fieldErrors
    );
  }

  try {
    return await db.report.create({
      data: {
        workspaceId,
        generatedBy: userId,
        title,
        periodStart,
        periodEnd,
        contentJson: validation.data as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        title: true,
        periodStart: true,
        periodEnd: true,
        contentJson: true,
        createdAt: true,
        generatedBy: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    throw createReportGenerationError(
      "REPORT_SAVE_FAILED",
      "Failed to save the generated report.",
      500,
      error instanceof Error ? error.message : error
    );
  }
}

function buildStatistics(
  feedback: FeedbackForReport[]
): VoiceOfCustomerReportContent["statistics"] {
  const totalFeedback = feedback.length;
  const sentimentCounts: Record<SentimentKey, number> = {
    POS: 0,
    NEU: 0,
    NEG: 0,
  };
  const themeCounts = new Map<
    string,
    { themeId: string; name: string; color: string | null; count: number }
  >();
  const sentimentScores: number[] = [];

  for (const item of feedback) {
    sentimentCounts[item.sentiment] += 1;

    if (Number.isFinite(item.sentimentScore)) {
      sentimentScores.push(item.sentimentScore);
    }

    for (const assignment of item.themes) {
      const existing = themeCounts.get(assignment.theme.id);

      if (existing) {
        existing.count += 1;
      } else {
        themeCounts.set(assignment.theme.id, {
          themeId: assignment.theme.id,
          name: assignment.theme.name,
          color: assignment.theme.color,
          count: 1,
        });
      }
    }
  }

  const averageSentimentScore =
    sentimentScores.length > 0
      ? roundTo(
          sentimentScores.reduce((sum, value) => sum + value, 0) /
            sentimentScores.length,
          3
        )
      : null;

  const topThemes = Array.from(themeCounts.values())
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.name.localeCompare(b.name) ||
        a.themeId.localeCompare(b.themeId)
    )
    .slice(0, MAX_TOP_THEMES)
    .map((theme) => ({
      ...theme,
      percentage:
        totalFeedback > 0 ? roundTo((theme.count / totalFeedback) * 100, 1) : 0,
    }));

  return {
    totalFeedback,
    sentimentDistribution: {
      POS: {
        count: sentimentCounts.POS,
        percentage: percentage(sentimentCounts.POS, totalFeedback),
      },
      NEU: {
        count: sentimentCounts.NEU,
        percentage: percentage(sentimentCounts.NEU, totalFeedback),
      },
      NEG: {
        count: sentimentCounts.NEG,
        percentage: percentage(sentimentCounts.NEG, totalFeedback),
      },
    },
    averageSentimentScore,
    sentimentScoreSampleSize: sentimentScores.length,
    topThemes,
  };
}

function buildEvidence(
  feedback: FeedbackForReport[]
): VoiceOfCustomerReportContent["evidence"] {
  return {
    representativeFeedback: selectRepresentativeFeedback(feedback).map(
      toFeedbackReference
    ),
    notableQuotes: selectNotableQuotes(feedback).map(toQuoteReference),
  };
}

function selectRepresentativeFeedback(
  feedback: FeedbackForReport[]
): FeedbackForReport[] {
  const selected = new Map<string, FeedbackForReport>();

  const add = (items: FeedbackForReport[]) => {
    for (const item of items) {
      if (selected.size >= MAX_REPRESENTATIVE_FEEDBACK) return;
      selected.set(item.id, item);
    }
  };

  add(
    feedback
      .filter((item) => item.sentiment === "NEG")
      .sort(byScoreAscendingThenRecent)
      .slice(0, 3)
  );
  add(
    feedback
      .filter((item) => item.sentiment === "POS")
      .sort(byScoreDescendingThenRecent)
      .slice(0, 3)
  );
  add(
    feedback
      .filter((item) => item.sentiment === "NEU")
      .sort(byNeutralityThenRecent)
      .slice(0, 2)
  );
  add(feedback.slice(0, MAX_REPRESENTATIVE_FEEDBACK));

  return Array.from(selected.values()).slice(0, MAX_REPRESENTATIVE_FEEDBACK);
}

function selectNotableQuotes(feedback: FeedbackForReport[]): FeedbackForReport[] {
  return feedback
    .filter((item) => item.content.trim().length > 0)
    .sort((a, b) => quoteRank(b) - quoteRank(a) || byRecentThenId(a, b))
    .slice(0, MAX_NOTABLE_QUOTES);
}

function toFeedbackReference(
  item: FeedbackForReport
): VoiceOfCustomerReportContent["evidence"]["representativeFeedback"][number] {
  return {
    feedbackId: item.id,
    content: truncate(item.content.trim(), 600),
    channel: item.channel,
    customerLabel: item.customerLabel,
    sentiment: item.sentiment,
    sentimentScore: roundTo(item.sentimentScore, 3),
    urgency: item.urgency,
    shortSummary: item.shortSummary,
    createdAt: item.createdAt.toISOString(),
    themes: item.themes
      .map((assignment) => ({
        themeId: assignment.theme.id,
        name: assignment.theme.name,
        color: assignment.theme.color,
        confidence: roundTo(assignment.confidence, 3),
      }))
      .sort(
        (a, b) =>
          b.confidence - a.confidence ||
          a.name.localeCompare(b.name) ||
          a.themeId.localeCompare(b.themeId)
      ),
  };
}

function toQuoteReference(
  item: FeedbackForReport
): VoiceOfCustomerReportContent["evidence"]["notableQuotes"][number] {
  const trimmed = item.content.trim();
  const quote = truncate(trimmed, 360);

  return {
    feedbackId: item.id,
    quote,
    isTruncated: quote.length < trimmed.length,
    sentiment: item.sentiment,
    sentimentScore: roundTo(item.sentimentScore, 3),
    channel: item.channel,
    createdAt: item.createdAt.toISOString(),
  };
}

function quoteRank(item: FeedbackForReport): number {
  const urgencyWeights: Record<UrgencyKey, number> = {
    CRITICAL: 40,
    HIGH: 30,
    MEDIUM: 20,
    LOW: 10,
  };

  return (
    urgencyWeights[item.urgency] +
    Math.abs(item.sentimentScore) * 10 +
    Math.min(item.themes.length, 5) +
    Math.min(item.content.trim().length / 250, 4)
  );
}

function byScoreAscendingThenRecent(
  a: FeedbackForReport,
  b: FeedbackForReport
): number {
  return a.sentimentScore - b.sentimentScore || byRecentThenId(a, b);
}

function byScoreDescendingThenRecent(
  a: FeedbackForReport,
  b: FeedbackForReport
): number {
  return b.sentimentScore - a.sentimentScore || byRecentThenId(a, b);
}

function byNeutralityThenRecent(
  a: FeedbackForReport,
  b: FeedbackForReport
): number {
  return (
    Math.abs(a.sentimentScore) - Math.abs(b.sentimentScore) ||
    byRecentThenId(a, b)
  );
}

function byRecentThenId(a: FeedbackForReport, b: FeedbackForReport): number {
  return (
    b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id)
  );
}

function percentage(count: number, total: number): number {
  return total > 0 ? roundTo((count / total) * 100, 1) : 0;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildReportTitle(periodStart: Date, periodEnd: Date): string {
  return `Voice-of-Customer Report: ${buildPeriodLabel(
    periodStart,
    periodEnd
  )}`;
}

function buildPeriodLabel(periodStart: Date, periodEnd: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${formatter.format(periodStart)} - ${formatter.format(periodEnd)}`;
}

function createReportGenerationError(
  code: ReportGenerationErrorCode,
  message: string,
  httpStatus?: number,
  details?: unknown
): ReportGenerationError {
  const error = new Error(message) as ReportGenerationError & Error;
  error.code = code;
  error.httpStatus = httpStatus;
  error.details = details;
  error.name = "ReportGenerationError";
  return error as ReportGenerationError;
}

export function isReportGenerationError(
  error: unknown
): error is ReportGenerationError {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as ReportGenerationError).code === "string"
  );
}
