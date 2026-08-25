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
  Plus,
  Sparkles,
  Inbox,
  BarChart2,
  PieChart,
  Shield,
  Layers,
  ArrowRight,
  Calendar,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import VolumeChart from "@/components/dashboard/VolumeChart";
import SentimentChart from "@/components/dashboard/SentimentChart";
import ThemesChart from "@/components/dashboard/ThemesChart";
import type { SentimentData } from "@/components/dashboard/SentimentChart";

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  sourceRef: string | null;
  customerLabel: string | null;
  sentiment: string;
  sentimentScore: number;
  status: string;
  createdAt: string;
  themes?: Array<{
    theme: { id: string; name: string; color: string };
    confidence: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    metrics: { totalFeedback: number; negativePercentage: number; newThisWeek: number };
    sentiment: SentimentData;
    themes: Array<{ themeId: string; name: string; color: string | null; count: number }>;
    volumeByDate: Array<{ date: string; count: number }>;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setAnalyticsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const res = await fetch("/api/feedback?page=1&pageSize=50");
        if (!res.ok) {
          throw new Error("Failed to load dashboard metrics");
        }
        const data = await res.json();
        setFeedback(data.feedback || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
    loadAnalytics();
  }, [loadAnalytics]);

  // Derive analytics fields safely
  const totalFeedback = analytics?.metrics?.totalFeedback ?? 0;
  const negativePercentage = analytics?.metrics?.negativePercentage ?? 0;
  const newThisWeek = analytics?.metrics?.newThisWeek ?? 0;
  const activeThemeCount = analytics?.themes?.length ?? 0;

  

  function handleDateApply() {
    setDateError(null);
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateError("Start date must be before end date.");
      return;
    }
    loadAnalytics(dateFrom || undefined, dateTo || undefined);
  }

  function handleDateClear() {
    setDateFrom("");
    setDateTo("");
    setDateError(null);
    loadAnalytics();
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                <Shield className="w-3 h-3 mr-1" />
                {user?.role || "USER"} PERMISSIONS
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                WS: {user?.workspaceId ? `${user.workspaceId.slice(0, 10)}...` : "Isolation Active"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {getGreeting()}, {user?.name || user?.email?.split("@")[0] || "Team"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Here is your customer feedback intelligence snapshot. Monitor incoming channel signals and key metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/feedback">
              <Button
                variant="primary"
                size="md"
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Feedback Inbox
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Analytics Date Range</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <label htmlFor="dash-dateFrom" className="text-[11px] text-slate-500 whitespace-nowrap">From</label>
              <input
                id="dash-dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="dash-dateTo" className="text-[11px] text-slate-500 whitespace-nowrap">To</label>
              <input
                id="dash-dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleDateApply} variant="primary" size="sm">Apply</Button>
              <Button onClick={handleDateClear} variant="outline" size="sm" leftIcon={<RotateCcw className="w-3 h-3" />}>Clear</Button>
            </div>
          </div>
        </div>
        {dateError && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {/* Metrics Stat Cards */}
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Feedback
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-slate-900">
                    {totalFeedback}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Total recorded feedback signals
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Negative Feedback %
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-rose-600">
                    {negativePercentage}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Negative feedback ratio
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    New Inbox Items
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-sky-600">
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Active Themes
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Tag className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-slate-900">
                    {activeThemeCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Discovered feedback topics
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Analytics Insights Area */}
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

      {/* Recent Feedback Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Inbox className="w-4 h-4 text-indigo-600" />
              Recent Feedback Activity
            </CardTitle>
            <CardDescription>
              Latest incoming feedback entries in your workspace
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
              <p className="text-sm font-medium text-slate-700">No feedback entries found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Get started by adding your first feedback record or importing a CSV file.
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
                  <TableHead>Content</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-md font-medium text-slate-900">
                      <p className="line-clamp-1">{item.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
