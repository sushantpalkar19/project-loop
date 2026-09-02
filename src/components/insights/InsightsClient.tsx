"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Tag,
  Smile,
  Meh,
  Frown,
  ArrowRight,
  RefreshCw,
  Sparkles,
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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold">
                <Sparkles className="w-3 h-3 mr-1" />
                AI TOPIC CLUSTERING & SENTIMENT
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Customer Insights & Trends
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore discovered customer feedback themes, recurring friction points, feature praise, and sentiment distribution patterns across your workspace.
            </p>
          </div>

          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700 shrink-0"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Insights
          </Button>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Unable to load insights analytics"
          message={error}
          onRetry={fetchAnalytics}
        />
      )}

      {/* Sentiment Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card hoverEffect className="border-emerald-200/80 shadow-2xs">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <Smile className="w-4 h-4 text-emerald-600" />
                    Positive Drivers
                  </span>
                  <Badge variant="pos" size="sm" className="font-bold">
                    {sentiment.POS.percentage}%
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {sentiment.POS.count}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Positive feedback items praising product & experience
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect className="border-slate-200 shadow-2xs">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Meh className="w-4 h-4 text-slate-500" />
                    Neutral Signals
                  </span>
                  <Badge variant="neu" size="sm" className="font-bold">
                    {sentiment.NEU.percentage}%
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {sentiment.NEU.count}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Informational or neutral feature inquiries
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect className="border-rose-200 shadow-2xs">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    <Frown className="w-4 h-4 text-rose-600" />
                    Customer Pain Points
                  </span>
                  <Badge variant="neg" size="sm" className="font-bold">
                    {sentiment.NEG.percentage}%
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-rose-600">
                    {sentiment.NEG.count}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Negative feedback signals indicating friction or bugs
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Sentiment & Top Themes Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentChart data={sentiment} loading={loading} />
        <ThemesChart data={themes} loading={loading} />
      </div>

      {/* Top Discovered Theme Cards Grid with Drilldown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <Tag className="w-4 h-4 text-indigo-600" />
            Top Discovered Theme Clusters
          </CardTitle>
          <CardDescription>
            Click any theme card to drill down into the underlying customer feedback entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : themes.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-700 text-sm">No themes discovered yet</p>
              <p>Import or submit feedback signals to run AI classification and topic clustering.</p>
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
                      Customer feedback related to {t.name.toLowerCase()} issues & requests.
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

      {/* Theme Drill-Down Modal */}
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
