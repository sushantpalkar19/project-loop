"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Tag,
  Smile,
  Meh,
  Frown,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Inbox,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, StatCardSkeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import SentimentChart from "@/components/dashboard/SentimentChart";
import ThemesChart from "@/components/dashboard/ThemesChart";
import type { SentimentData } from "@/components/dashboard/SentimentChart";

interface ThemeItem {
  themeId: string;
  name: string;
  color: string | null;
  count: number;
}

interface AnalyticsData {
  metrics: {
    totalFeedback: number;
    negativePercentage: number;
    newThisWeek: number;
  };
  sentiment: SentimentData;
  themes: ThemeItem[];
  volumeByDate: Array<{ date: string; count: number }>;
}

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  sentiment: string;
  status: string;
  customerLabel: string | null;
  createdAt: string;
}

export default function InsightsClient() {
  const { error: toastError, info } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drilldown state
  const [selectedTheme, setSelectedTheme] = useState<ThemeItem | null>(null);
  const [themeFeedback, setThemeFeedback] = useState<FeedbackItem[]>([]);
  const [themeFeedbackLoading, setThemeFeedbackLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics/overview");
      if (!res.ok) {
        throw new Error("Failed to load analytics data");
      }
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      toastError(msg, "Insights Load Failed");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleOpenThemeDrilldown = async (theme: ThemeItem) => {
    setSelectedTheme(theme);
    setThemeFeedbackLoading(true);
    info(`Loading feedback signals for theme "${theme.name}"...`, "Theme Drilldown");
    try {
      const res = await fetch(`/api/feedback?themeId=${theme.themeId}&pageSize=30`);
      if (res.ok) {
        const data = await res.json();
        setThemeFeedback(data.feedback || []);
      }
    } catch {
      setThemeFeedback([]);
    } finally {
      setThemeFeedbackLoading(false);
    }
  };

  const sentiment = analytics?.sentiment ?? {
    POS: { count: 0, percentage: 0 },
    NEU: { count: 0, percentage: 0 },
    NEG: { count: 0, percentage: 0 },
  };

  const themes = analytics?.themes ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* ── 1. COMPACT HERO BANNER ───────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl px-6 py-5 text-white border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: badge + title + subtitle */}
          <div className="space-y-1.5 min-w-0">
            <Badge
              variant="primary"
              size="sm"
              className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold w-fit"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI TOPIC CLUSTERING &amp; SENTIMENT
            </Badge>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
              Customer Insights &amp; Trends
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Discovered themes, sentiment patterns and recurring friction points across your workspace feedback.
            </p>
          </div>

          {/* Right: refresh action */}
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 shrink-0 self-start sm:self-auto"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <ErrorState
          title="Unable to load insights analytics"
          message={error}
          onRetry={fetchAnalytics}
        />
      )}

      {/* ── 2. KPI SENTIMENT CARDS ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Positive */}
            <Card hoverEffect className="border-emerald-200/70">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Smile className="w-4.5 h-4.5 text-emerald-600" style={{ width: "18px", height: "18px" }} />
                  </div>
                  <Badge variant="pos" size="sm" className="font-bold tabular-nums">
                    {sentiment.POS.percentage}%
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {sentiment.POS.count}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5">
                    Positive Drivers
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Feedback praising product &amp; experience
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Neutral */}
            <Card hoverEffect className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <Meh className="text-slate-500" style={{ width: "18px", height: "18px" }} />
                  </div>
                  <Badge variant="neu" size="sm" className="font-bold tabular-nums">
                    {sentiment.NEU.percentage}%
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {sentiment.NEU.count}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mt-0.5">
                    Neutral Signals
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Informational or neutral feature inquiries
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Negative */}
            <Card hoverEffect className="border-rose-200/70">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                    <Frown className="text-rose-600" style={{ width: "18px", height: "18px" }} />
                  </div>
                  <Badge variant="neg" size="sm" className="font-bold tabular-nums">
                    {sentiment.NEG.percentage}%
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-rose-600 tabular-nums">
                    {sentiment.NEG.count}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 mt-0.5">
                    Customer Pain Points
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Negative signals indicating friction or bugs
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── 3. CHARTS ROW ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentChart data={sentiment} loading={loading} />
        <ThemesChart data={themes} loading={loading} />
      </div>

      {/* ── 4. TOP THEME CLUSTERS GRID ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 font-bold">
                <Tag className="w-4 h-4 text-indigo-600" />
                Top Discovered Theme Clusters
              </CardTitle>
              <CardDescription className="mt-0.5">
                Click any theme card to drill down into the underlying customer feedback entries
              </CardDescription>
            </div>
            {themes.length > 0 && (
              <Badge variant="primary" size="sm" className="font-bold shrink-0">
                {themes.length} cluster{themes.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : themes.length === 0 ? (
            /* ── Intentionally-designed empty state ── */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Inbox className="w-7 h-7 text-indigo-400" />
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-sm font-bold text-slate-800">No themes discovered yet</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Import or submit customer feedback to run AI classification. Themes are automatically clustered from your workspace data.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Link href="/feedback">
                  <Button variant="outline" size="sm">
                    View Feedback
                  </Button>
                </Link>
                <Button
                  onClick={fetchAnalytics}
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((t, idx) => (
                <div
                  key={t.themeId}
                  onClick={() => handleOpenThemeDrilldown(t)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      #{idx + 1} CLUSTER
                    </span>
                    <Badge variant="primary" size="sm" className="group-hover:bg-indigo-600 group-hover:text-white transition-colors font-bold">
                      {t.count} items
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      Customer feedback related to {t.name.toLowerCase()} issues &amp; requests.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                    <span>View Related Feedback</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 5. THEME DRILLDOWN MODAL ─────────────────────────────────── */}
      {selectedTheme && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedTheme(null)}
          title={`Theme Cluster: "${selectedTheme.name}"`}
          subtitle={`Showing underlying customer feedback signals (${selectedTheme.count} total)`}
          maxWidth="2xl"
        >
          <div className="p-6 space-y-4">
            {themeFeedbackLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : themeFeedback.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No feedback items found for this theme.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                {themeFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-medium">
                      {item.content}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm" className="capitalize font-mono">
                          {item.channel}
                        </Badge>
                        <Badge
                          variant={
                            item.sentiment === "POS"
                              ? "pos"
                              : item.sentiment === "NEG"
                              ? "neg"
                              : "neu"
                          }
                          size="sm"
                        >
                          {item.sentiment}
                        </Badge>
                      </div>
                      <span className="font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button onClick={() => setSelectedTheme(null)} variant="outline" size="sm">
                Close Drilldown
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
