"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  FileText,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";
import type { VoiceOfCustomerReportContent } from "@/lib/validations/reports";

type SentimentKey = "POS" | "NEU" | "NEG";
type ActionPriority = "HIGH" | "MEDIUM" | "LOW";

interface ReportRecord {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  contentJson: VoiceOfCustomerReportContent;
  createdAt: string;
  generatedBy: string;
  author: {
    name: string | null;
    email: string | null;
  };
}

const SENTIMENT_LABELS: Record<SentimentKey, string> = {
  POS: "Positive",
  NEU: "Neutral",
  NEG: "Negative",
};

const SENTIMENT_BAR_COLORS: Record<SentimentKey, string> = {
  POS: "bg-emerald-500",
  NEU: "bg-slate-400",
  NEG: "bg-rose-500",
};

const PRIORITY_VARIANTS: Record<
  ActionPriority,
  "danger" | "warning" | "neutral"
> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(end.getUTCDate() - 29);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sentimentVariant(sentiment: SentimentKey) {
  if (sentiment === "POS") return "pos";
  if (sentiment === "NEG") return "neg";
  return "neu";
}

export default function ReportsClient() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canGenerate = role === "ADMIN" || role === "ANALYST";
  const { success, error: toastError, info } = useToast();

  const defaultDates = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(
    null
  );
  const [loadingReports, setLoadingReports] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    setError(null);

    try {
      const response = await fetch("/api/reports?limit=25");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load reports");
      }

      const nextReports = data.reports || [];
      setReports(nextReports);
      setSelectedReport((current) => current ?? nextReports[0] ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load reports";
      setError(msg);
      toastError(msg, "Reports Load Error");
    } finally {
      setLoadingReports(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleGenerate() {
    setError(null);

    if (!canGenerate) {
      const msg = "You do not have permission to generate reports.";
      setError(msg);
      toastError(msg, "Access Restricted");
      return;
    }

    if (!startDate || !endDate) {
      const msg = "Select both a start date and an end date.";
      setError(msg);
      toastError(msg, "Invalid Date Range");
      return;
    }

    if (startDate > endDate) {
      const msg = "End date must be on or after start date.";
      setError(msg);
      toastError(msg, "Invalid Date Range");
      return;
    }

    setGenerating(true);
    info("Generating VoC narrative with Gemini AI...", "Report Generation Started");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      const report = data.report as ReportRecord;
      setSelectedReport(report);
      setReports((current) => [
        report,
        ...current.filter((item) => item.id !== report.id),
      ]);
      success("Voice-of-Customer report generated successfully.", "Report Ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate report";
      setError(msg);
      toastError(msg, "Generation Error");
    } finally {
      setGenerating(false);
    }
  }

  function handleDateRangeChange({ startDate: s, endDate: e }: { startDate: string; endDate: string }) {
    setStartDate(s);
    setEndDate(e);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Voice-of-Customer Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Generate period-based customer feedback reports from workspace data,
            saved with structured evidence for future export.
          </p>
        </div>

        <Badge variant={canGenerate ? "primary" : "neutral"} size="sm" className="w-fit font-bold">
          {canGenerate ? "Gemini narrative enabled" : "Read-only"}
        </Badge>
      </div>

      {canGenerate && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Reporting Period & Controls
            </CardTitle>
            <CardDescription>
              Select the date range used to fetch and summarize customer feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateRangeChange}
                onClear={() => {
                  const d = getDefaultDateRange();
                  setStartDate(d.startDate);
                  setEndDate(d.endDate);
                }}
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerate}
                  isLoading={generating}
                  disabled={generating}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  variant="primary"
                  size="md"
                  className="font-bold"
                >
                  Generate Report
                </Button>
                <Button
                  onClick={loadReports}
                  variant="outline"
                  size="md"
                  disabled={loadingReports || generating}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <ErrorState
          title="Unable to load reports"
          message={error}
          onRetry={loadReports}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6">
          {generating && !selectedReport ? (
            <GeneratingState />
          ) : selectedReport ? (
            <ReportDisplay report={selectedReport} />
          ) : (
            <EmptyReportState loading={loadingReports} canGenerate={canGenerate} />
          )}
        </div>

        <PreviousReports
          reports={reports}
          selectedReportId={selectedReport?.id ?? null}
          loading={loadingReports}
          onSelect={setSelectedReport}
        />
      </div>
    </div>
  );
}

function ReportDisplay({ report }: { report: ReportRecord }) {
  const content = report.contentJson;
  const stats = content.statistics;
  const negative = stats.sentimentDistribution.NEG;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm" className="font-bold">
                {content.reportType.replaceAll("_", " ")}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                v{content.schemaVersion}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {content.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generated {formatDateTime(report.createdAt)} by{" "}
              <span className="font-semibold text-slate-800">
                {report.author?.name || report.author?.email || "LOOP user"}
              </span>
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Period
            </p>
            <p className="text-sm font-bold text-slate-900">
              {content.period.label}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Feedback"
          value={String(stats.totalFeedback)}
          helper="Signals in selected period"
        />
        <MetricCard
          label="Negative Share"
          value={`${negative.percentage}%`}
          helper={`${negative.count} negative signal${
            negative.count === 1 ? "" : "s"
          }`}
          tone="danger"
        />
        <MetricCard
          label="Avg. Sentiment"
          value={
            stats.averageSentimentScore === null
              ? "N/A"
              : stats.averageSentimentScore.toFixed(2)
          }
          helper={`${stats.sentimentScoreSampleSize} scored feedback${
            stats.sentimentScoreSampleSize === 1 ? "" : "s"
          }`}
        />
        <MetricCard
          label="Top Themes"
          value={String(stats.topThemes.length)}
          helper="Ranked by feedback count"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentSummary content={content} />
        <TopThemes content={content} />
      </div>

      <NarrativeSection content={content} />
      <EvidenceSection content={content} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card hoverEffect>
      <CardContent className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-extrabold mt-2",
            tone === "danger" ? "text-rose-600" : "text-slate-900"
          )}
        >
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1">{helper}</p>
      </CardContent>
    </Card>
  );
}

function SentimentSummary({
  content,
}: {
  content: VoiceOfCustomerReportContent;
}) {
  const total = content.statistics.totalFeedback;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-bold">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          Sentiment Summary
        </CardTitle>
        <CardDescription>
          Deterministic sentiment distribution for this period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(SENTIMENT_LABELS) as SentimentKey[]).map((key) => {
          const item = content.statistics.sentimentDistribution[key];

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={sentimentVariant(key)} size="sm" className="font-bold">
                    {key}
                  </Badge>
                  <span className="font-semibold text-slate-700">
                    {SENTIMENT_LABELS[key]}
                  </span>
                </div>
                <span className="font-mono text-slate-500 font-medium">
                  {item.count}/{total} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", SENTIMENT_BAR_COLORS[key])}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TopThemes({ content }: { content: VoiceOfCustomerReportContent }) {
  const themes = content.statistics.topThemes;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-bold">
          <Tag className="w-4 h-4 text-purple-600" />
          Top Themes
        </CardTitle>
        <CardDescription>
          Theme counts calculated before narrative generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {themes.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-xs text-slate-400 font-medium">
            No themes were associated with this period.
          </div>
        ) : (
          <div className="space-y-3">
            {themes.map((theme) => (
              <div key={theme.themeId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: theme.color || "#6366f1" }}
                    />
                    <span className="font-bold text-slate-800 truncate">
                      {theme.name}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 whitespace-nowrap">
                    {theme.count} ({theme.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${theme.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NarrativeSection({
  content,
}: {
  content: VoiceOfCustomerReportContent;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-bold">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          AI Narrative & Executive Summary
        </CardTitle>
        <CardDescription>
          Generated from the calculated statistics and selected evidence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-5 shadow-2xs">
          <p className="text-xs sm:text-sm leading-relaxed text-indigo-950 whitespace-pre-wrap font-medium">
            {content.narrative.executiveSummary}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {content.narrative.sections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {section.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">
              Recommended Actions
            </h3>
            <Badge variant="neutral" size="sm" className="font-bold">
              {content.narrative.recommendedActions.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {content.narrative.recommendedActions.map((action) => (
              <div
                key={`${action.priority}-${action.title}`}
                className="rounded-2xl border border-slate-200 p-4 bg-white space-y-2 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {action.title}
                  </h4>
                  <Badge
                    variant={PRIORITY_VARIANTS[action.priority]}
                    size="sm"
                    className="w-fit font-bold"
                  >
                    {action.priority}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                  {action.rationale}
                </p>
                {action.evidenceIds.length > 0 && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    Evidence:{" "}
                    {action.evidenceIds
                      .map((id) => id.slice(0, 8))
                      .join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceSection({
  content,
}: {
  content: VoiceOfCustomerReportContent;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <FileText className="w-4 h-4 text-sky-600" />
            Representative Feedback
          </CardTitle>
          <CardDescription>
            Selected deterministically before the Gemini call
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.evidence.representativeFeedback.map((item) => (
            <div
              key={item.feedbackId}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant={sentimentVariant(item.sentiment)} size="sm" className="font-bold">
                  {item.sentiment}
                </Badge>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {item.shortSummary || item.content}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="neutral" size="sm" className="capitalize font-mono">
                  {item.channel}
                </Badge>
                {item.themes.slice(0, 3).map((theme) => (
                  <Badge key={theme.themeId} variant="primary" size="sm" className="font-semibold">
                    {theme.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <MessageSquareQuote className="w-4 h-4 text-amber-600" />
            Notable Quotes
          </CardTitle>
          <CardDescription>
            Exact feedback excerpts stored separately from AI narrative
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.evidence.notableQuotes.map((quote) => (
            <div
              key={quote.feedbackId}
              className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
            >
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium italic">
                &ldquo;{quote.quote}&rdquo;
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={sentimentVariant(quote.sentiment)} size="sm" className="font-bold">
                    {quote.sentiment}
                  </Badge>
                  <Badge variant="neutral" size="sm" className="capitalize font-mono">
                    {quote.channel}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatDate(quote.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PreviousReports({
  reports,
  selectedReportId,
  loading,
  onSelect,
}: {
  reports: ReportRecord[];
  selectedReportId: string | null;
  loading: boolean;
  onSelect: (report: ReportRecord) => void;
}) {
  return (
    <Card className="h-fit xl:sticky xl:top-24">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-bold">
          <FileText className="w-4 h-4 text-indigo-600" />
          Previous Reports
        </CardTitle>
        <CardDescription>Saved reports for this workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No saved reports yet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Generated reports will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => onSelect(report)}
                className={cn(
                  "w-full text-left rounded-xl border p-3.5 transition-colors",
                  selectedReportId === report.id
                    ? "border-indigo-300 bg-indigo-50/80 shadow-2xs"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <p className="text-xs font-bold text-slate-900 line-clamp-2">
                  {report.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  {formatDate(report.createdAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GeneratingState() {
  return (
    <Card>
      <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[320px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <div>
          <p className="text-sm font-bold text-slate-900">
            Generating Voice-of-Customer report
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Calculating statistics and asking Gemini AI for the narrative.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyReportState({
  loading,
  canGenerate,
}: {
  loading: boolean;
  canGenerate: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[320px]">
        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
          <FileText className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {canGenerate ? "Generate your first VoC report" : "No saved reports"}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Select a reporting period and click Generate Report to create an executive narrative.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
