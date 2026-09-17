"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import FeedbackList from "@/components/feedback/FeedbackList";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackDetail from "@/components/feedback/FeedbackDetail";
import FilterBar from "@/components/feedback/FilterBar";
import Pagination from "@/components/feedback/Pagination";
import CsvUpload from "@/components/feedback/CsvUpload";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import { Plus, Upload, Zap } from "lucide-react";
import { canManageFeedback } from "@/lib/rbac";

// ── Types ─────────────────────────────────────

interface ThemeOption {
  id: string;
  name: string;
  color: string;
}

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

interface PaginationData {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Filters {
  search: string;
  channel: string;
  sentiment: string;
  status: string;
  themeId: string;
  dateFrom: string;
  dateTo: string;
}

// ── Page Component ────────────────────────────

export default function FeedbackPage() {
  const { data: session, status: sessionStatus } = useSession();
  const role = session?.user?.role;
  const { success, error: toastError, info } = useToast();

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    search: "",
    channel: "",
    sentiment: "",
    status: "",
    themeId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [themes, setThemes] = useState<ThemeOption[]>([]);

  // ── Fetch themes on mount

  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch("/api/themes");
        if (res.ok) {
          const data = await res.json();
          setThemes(data.themes);
        }
      } catch {
        // Themes are non-critical; silently ignore failure
      }
    }
    fetchThemes();
  }, []);

  // ── Fetch Feedback ──────────────────────────

  const fetchFeedback = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", "20");

        if (filters.search) params.set("search", filters.search);
        if (filters.channel) params.set("channel", filters.channel);
        if (filters.sentiment) params.set("sentiment", filters.sentiment);
        if (filters.status) params.set("status", filters.status);
        if (filters.themeId) params.set("themeId", filters.themeId);
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);

        const response = await fetch(`/api/feedback?${params.toString()}`);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const apiMessage =
            typeof data?.error === "string"
              ? data.error
              : "Failed to fetch feedback";
          throw new Error(apiMessage);
        }

        if (!Array.isArray(data.feedback) || !data.pagination) {
          throw new Error("Invalid feedback response from server");
        }

        setFeedback(data.feedback);
        setPagination(data.pagination);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An error occurred";
        setError(msg);
        toastError(msg, "Inbox Load Error");
      } finally {
        setLoading(false);
      }
    },
    [filters, toastError]
  );

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }
    if (sessionStatus === "unauthenticated") {
      setLoading(false);
      setError("Authentication required. Please sign in again.");
      return;
    }
    fetchFeedback(1);
  }, [fetchFeedback, refreshKey, sessionStatus]);

  // ── Handlers ────────────────────────────────

  function handlePageChange(page: number) {
    fetchFeedback(page);
  }

  function handleFilterChange(newFilters: Filters) {
    setFilters(newFilters);
  }

  function handleCreated() {
    setShowCreateForm(false);
    setRefreshKey((k) => k + 1);
    success("New feedback signal submitted and classified.", "Feedback Created");
  }

  function handleUpdated() {
    setSelectedFeedback(null);
    setRefreshKey((k) => k + 1);
    success("Feedback updated successfully.", "Workflow Updated");
  }

  function handleDeleted() {
    setSelectedFeedback(null);
    setRefreshKey((k) => k + 1);
    success("Feedback entry deleted.", "Signal Removed");
  }

  function handleImportComplete() {
    setRefreshKey((k) => k + 1);
    success("CSV batch imported and AI classified successfully.", "CSV Import Complete");
  }

  async function handleSimulate() {
    setSimulating(true);
    info("Simulating multi-channel feedback ingestion...", "Ingestion Processing");
    try {
      const response = await fetch("/api/feedback/simulate", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Simulation failed");
      }

      setRefreshKey((k) => k + 1);
      success("Simulated incoming customer feedback signals.", "Simulation Complete");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Simulation failed";
      setError(msg);
      toastError(msg, "Simulation Error");
    } finally {
      setSimulating(false);
    }
  }

  // ── Render ──────────────────────────────────

  const canCreate = canManageFeedback(role);

  const inboxSummary = loading
    ? "Loading feedback signals…"
    : error
      ? "Unable to load feedback count"
      : `Showing ${pagination.total} recorded feedback signals in your workspace`;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Feedback Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{inboxSummary}</p>
        </div>

        {canCreate && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setShowCsvUpload(!showCsvUpload)}
              variant="outline"
              size="md"
              leftIcon={<Upload className="w-4 h-4 text-slate-600" />}
            >
              {showCsvUpload ? "Hide CSV Import" : "Import CSV"}
            </Button>
            <Button
              onClick={handleSimulate}
              isLoading={simulating}
              variant="outline"
              size="md"
              leftIcon={<Zap className="w-4 h-4 text-amber-500" />}
            >
              Simulate Ingestion
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Feedback
            </Button>
          </div>
        )}
      </div>

      {/* CSV Upload Section */}
      {showCsvUpload && canCreate && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-150">
          <CsvUpload onImportComplete={handleImportComplete} />
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        themes={themes}
        onFilterChange={handleFilterChange}
        onApply={() => fetchFeedback(1)}
      />

      {/* Error State Component */}
      {error && (
        <ErrorState
          title="Unable to load feedback inbox"
          message={error}
          onRetry={() => fetchFeedback(1)}
        />
      )}

      {/* Feedback List Container */}
      {!error && (
        <FeedbackList
          feedback={feedback}
          loading={loading}
          onSelect={setSelectedFeedback}
          userRole={role}
          canImport={canCreate}
          onImportCsv={() => setShowCsvUpload(true)}
          onAddFeedback={() => setShowCreateForm(true)}
          onSimulate={canCreate ? handleSimulate : undefined}
          simulating={simulating}
        />
      )}

      {/* Pagination Container */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <FeedbackForm
          onClose={() => setShowCreateForm(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Detail/Edit Modal */}
      {selectedFeedback && (
        <FeedbackDetail
          feedback={selectedFeedback}
          userRole={role}
          onClose={() => setSelectedFeedback(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
