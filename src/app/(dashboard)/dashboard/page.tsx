"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  MessageSquare,
  TrendingDown,
  Clock,
  Tag,
  ArrowUpRight,
  Sparkles,
  Inbox,
  Shield,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import VolumeChart from "@/components/dashboard/VolumeChart";
import SentimentChart from "@/components/dashboard/SentimentChart";
import ThemesChart from "@/components/dashboard/ThemesChart";
import FeedbackDetail from "@/components/feedback/FeedbackDetail";
import type { SentimentData } from "@/components/dashboard/SentimentChart";

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  sourceRef: string | null;
  customerLabel: string | null;
  sentiment: string;
  sentimentScore: number;
  confidence: number | null;
  urgency: string;
  shortSummary: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  themes?: Array<{
    theme: { id: string; name: string; color: string };
    confidence: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role;
  const { success, error: toastError } = useToast();

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [analytics, setAnalytics] = useState<{
    metrics: { totalFeedback: number; negativePercentage: number; newThisWeek: number };
    sentiment: SentimentData;
    themes: Array<{ themeId: string; name: string; color: string | null; count: number }>;
    volumeByDate: Array<{ date: string; count: number }>;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadAnalytics = useCallback(
    async (from?: string, to?: string) => {
      try {
        setAnalyticsLoading(true);
        const params = new URLSearchParams();
        if (from) params.set("dateFrom", from);
        if (to) params.set("dateTo", to);
        const qs = params.toString();
        const res = await fetch(`/api/analytics/overview${qs ? `?${qs}` : ""}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        } else {
          throw new Error("Failed to load analytics");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An error occurred";
        setError(msg);
        toastError(msg, "Analytics Load Error");
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [toastError]
  );

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feedback?page=1&pageSize=50");
      if (!res.ok) {
        throw new Error("Failed to load dashboard feedback");
      }
      const data = await res.json();
      setFeedback(data.feedback || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadAnalytics();
  }, [loadDashboardData, loadAnalytics]);

  // Derive analytics fields safely
  const totalFeedback = analytics?.metrics?.totalFeedback ?? 0;
  const negativePercentage = analytics?.metrics?.negativePercentage ?? 0;
  const newThisWeek = analytics?.metrics?.newThisWeek ?? 0;
  const activeThemeCount = analytics?.themes?.length ?? 0;

  // Filter "Needs Attention" feedback (Negative sentiment OR Urgent OR NEW status)
  const needsAttentionList = feedback.filter(
    (item) => item.sentiment === "NEG" || item.status === "NEW" || item.urgency === "HIGH" || item.urgency === "CRITICAL"
  ).slice(0, 4);

  function handleDateChange({ startDate, endDate }: { startDate: string; endDate: string }) {
    setDateFrom(startDate);
    setDateTo(endDate);
    loadAnalytics(startDate || undefined, endDate || undefined);
    if (startDate || endDate) {
      success("Filtered workspace analytics by selected date range.", "Analytics Updated");
    }
  }

  function handleDateClear() {
    setDateFrom("");
    setDateTo("");
    loadAnalytics();
    success("Cleared date filter. Showing all-time metrics.", "Analytics Reset");
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Personalized Header Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold">
                <Shield className="w-3 h-3 mr-1" />
                {user?.role || "USER"} WORKSPACE
              </Badge>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                WS: {user?.workspaceId ? `${user.workspaceId.slice(0, 12)}...` : "Multi-tenant Isolation"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {getGreeting()}, {user?.name || user?.email?.split("@")[0] || "Team Member"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Here&apos;s what your customers are saying. Review sentiment trends, high-priority feedback, and key customer topics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/feedback">
              <Button
                variant="primary"
                size="md"
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Feedback Inbox
              </Button>
            </Link>
            <Link href="/ask">
              <Button
                variant="outline"
                size="md"
                className="bg-slate-800/80 hover:bg-slate-800 text-white border-slate-700"
                leftIcon={<Sparkles className="w-4 h-4 text-indigo-400" />}
              >
                Ask LOOP
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Customer Feedback Overview & Date Range Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Customer Feedback Overview
          </h2>
          <p className="text-xs text-slate-500">
            Filter workspace metrics by date range
          </p>
        </div>

        <DateRangePicker
          startDate={dateFrom}
          endDate={dateTo}
          onChange={handleDateChange}
          onClear={handleDateClear}
        />
      </div>

      {/* Error State Banner */}
      {error && (
        <ErrorState
          title="Unable to load analytics data"
          message={error}
          onRetry={() => {
            setError(null);
            loadDashboardData();
            loadAnalytics();
          }}
        />
      )}

      {/* 3. Important KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading || analyticsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card hoverEffect>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Feedback
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {totalFeedback}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Recorded customer signals
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Negative Feedback %
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-rose-600">
                    {negativePercentage}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Friction & complaint ratio
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    New Inbox Items
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-sky-600">
                    {newThisWeek}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Awaiting initial review
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Themes
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                    <Tag className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {activeThemeCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Categorized topic clusters
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 4. Real Analytics Charts Section */}
      <VolumeChart
        data={analytics?.volumeByDate ?? []}
        loading={analyticsLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentChart
          data={analytics?.sentiment ?? { POS: { count: 0, percentage: 0 }, NEU: { count: 0, percentage: 0 }, NEG: { count: 0, percentage: 0 } }}
          loading={analyticsLoading}
        />

        <ThemesChart
          data={analytics?.themes ?? []}
          loading={analyticsLoading}
        />
      </div>

      {/* 5. Needs Attention & Trending Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention Card */}
        <Card className="border-rose-200/80 shadow-2xs">
          <CardHeader className="bg-rose-50/40 border-b border-rose-100 rounded-t-2xl flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm text-rose-950 flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Needs Attention
              </CardTitle>
              <CardDescription className="text-xs text-rose-800/80">
                Negative & high-priority feedback requiring triage
              </CardDescription>
            </div>
            <Link href="/feedback?sentiment=NEG">
              <Button variant="outline" size="sm" className="border-rose-200 text-rose-800 hover:bg-rose-100">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : needsAttentionList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                🎉 No critical or negative feedback items requiring immediate attention.
              </div>
            ) : (
              needsAttentionList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFeedback(item)}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 line-clamp-2">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="capitalize">{item.channel}</span>
                      <span>•</span>
                      <span className="font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={item.sentiment === "NEG" ? "neg" : "warning"} size="sm">
                      {item.sentiment}
                    </Badge>
                    <Badge variant={item.status === "NEW" ? "new" : "reviewed"} size="sm">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Trending Insights Overview */}
        <Card className="border-indigo-200/60 shadow-2xs">
          <CardHeader className="bg-indigo-50/30 border-b border-indigo-100 rounded-t-2xl flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm text-indigo-950 flex items-center gap-2 font-bold">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Top Discovered Themes
              </CardTitle>
              <CardDescription className="text-xs text-indigo-800/80">
                Most frequent customer feedback topics
              </CardDescription>
            </div>
            <Link href="/trends">
              <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-800 hover:bg-indigo-100">
                Explore Trends
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {analyticsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !analytics?.themes || analytics.themes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="space-y-0.5 max-w-[280px]">
                  <p className="text-xs font-bold text-slate-800">Theme insights will appear here</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Once enough feedback is classified, LOOP will surface recurring customer topics and supporting signals.
                  </p>
                </div>
                <Link href="/feedback">
                  <Button variant="outline" size="sm" className="h-7 text-xs font-semibold mt-1">
                    View Feedback
                  </Button>
                </Link>
              </div>
            ) : (
              analytics.themes.slice(0, 4).map((t, idx) => (
                <div
                  key={t.themeId}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-xs text-slate-600 flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {t.count} recorded feedback entries
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm" className="shrink-0 font-bold">
                    {t.count} items
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. Recent Feedback Feed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <Inbox className="w-4 h-4 text-indigo-600" />
              Recent Feedback Activity
            </CardTitle>
            <CardDescription>
              Latest customer feedback recorded in your workspace
            </CardDescription>
          </div>
          <Link href="/feedback">
            <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
              View All Feedback
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : feedback.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm font-semibold text-slate-700">No feedback entries found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Get started by adding single feedback or importing a CSV file.
              </p>
              <Link href="/feedback">
                <Button variant="primary" size="sm" className="mt-2">
                  Go to Feedback Inbox
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Feedback Content</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Recorded Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.slice(0, 6).map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 cursor-pointer" onClick={() => setSelectedFeedback(item)}>
                    <TableCell className="max-w-md font-medium text-slate-900">
                      <p className="line-clamp-1">{item.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm" className="capitalize font-medium">
                        {item.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "NEW"
                            ? "new"
                            : item.status === "REVIEWED"
                            ? "reviewed"
                            : "actioned"
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="p-1 h-7 text-indigo-600 hover:text-indigo-900">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Selected Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetail
          feedback={selectedFeedback}
          userRole={role}
          onClose={() => setSelectedFeedback(null)}
          onUpdated={() => {
            setSelectedFeedback(null);
            loadDashboardData();
            loadAnalytics();
            success("Feedback updated successfully.", "Workflow Status");
          }}
          onDeleted={() => {
            setSelectedFeedback(null);
            loadDashboardData();
            loadAnalytics();
            success("Feedback deleted successfully.", "Action Complete");
          }}
        />
      )}
    </div>
  );
}
