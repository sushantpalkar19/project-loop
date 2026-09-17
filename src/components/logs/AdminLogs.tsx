"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Shield,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";

// ── Types ─────────────────────────────────────

interface LogEntry {
  id: string;
  action: string;
  message: string;
  userId: string | null;
  userName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Helpers ───────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate().toString().padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

function actionBadgeVariant(action: string): "purple" | "info" | "success" | "warning" | "danger" | "neutral" {
  if (action.includes("created") || action.includes("added")) return "success";
  if (action.includes("deleted") || action.includes("removed")) return "danger";
  if (action.includes("updated") || action.includes("changed") || action.includes("role")) return "warning";
  if (action.includes("classified") || action.includes("ai")) return "purple";
  return "info";
}

function actionLabel(action: string): string {
  return action
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" › ");
}

// ── Component ────────────────────────────────

export default function AdminLogs() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";
  const { error: toastError } = useToast();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterAction, setFilterAction] = useState<string>("");
  const pageSize = 20;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (filterAction) {
        params.set("action", filterAction);
      }

      const res = await fetch(`/api/admin/logs?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You do not have permission to view activity logs.");
        }
        if (res.status === 401) {
          throw new Error("Authentication required.");
        }
        throw new Error("Failed to load activity logs.");
      }

      const data: LogsResponse = await res.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      toastError(msg, "Logs Load Failed");
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, toastError]);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, fetchLogs]);

  // ── Access denied for non-admin ────────────
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs border border-rose-200">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Admin Access Required</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Only Admin users have permission to view system activity logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold">
                <Shield className="w-3.5 h-3.5 mr-1" />
                ADMIN AUDIT LOG
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              System Activity Logs
            </h1>
            <p className="text-xs text-slate-300">
              View all admin and system activity events for your workspace.
              {total > 0 && (
                <span className="ml-1 font-semibold text-indigo-300">
                  {total} total log{total !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={fetchLogs}
              variant="outline"
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 shrink-0"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Actions</option>
          <option value="member.created">Member Created</option>
          <option value="member.role_changed">Role Changed</option>
          <option value="member.removed">Member Removed</option>
          <option value="feedback.created">Feedback Created</option>
          <option value="feedback.csv_import">CSV Import</option>
          <option value="feedback.simulated">Simulated Ingestion</option>
          <option value="feedback.reclassified">Reclassified</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Unable to load activity logs"
          message={error}
          onRetry={fetchLogs}
        />
      )}

      {/* Logs Table */}
      {!error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-indigo-600" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Timestamped record of admin and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : logs.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-10 h-10 text-slate-300" />}
                title="No activity logs yet"
                description="Activity events will appear here as admins and system actions occur."
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-slate-500 font-mono whitespace-nowrap">
                          {formatTimestamp(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={actionBadgeVariant(log.action)}
                            size="sm"
                            className="font-semibold"
                          >
                            {actionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {log.userName || "System"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                          {log.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        Next
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
