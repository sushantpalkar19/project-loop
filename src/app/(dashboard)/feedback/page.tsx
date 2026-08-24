"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import FeedbackList from "@/components/feedback/FeedbackList";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackDetail from "@/components/feedback/FeedbackDetail";
import FilterBar from "@/components/feedback/FilterBar";
import Pagination from "@/components/feedback/Pagination";
import CsvUpload from "@/components/feedback/CsvUpload";

// ── Types ─────────────────────────────────────

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
  dateFrom: string;
  dateTo: string;
}

// ── Page Component ────────────────────────────

export default function FeedbackPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

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
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);

        const response = await fetch(`/api/feedback?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch feedback");
        }

        const data = await response.json();
        setFeedback(data.feedback);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchFeedback(1);
  }, [fetchFeedback, refreshKey]);

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
  }

  function handleUpdated() {
    setSelectedFeedback(null);
    setRefreshKey((k) => k + 1);
  }

  function handleDeleted() {
    setSelectedFeedback(null);
    setRefreshKey((k) => k + 1);
  }

  function handleImportComplete() {
    setRefreshKey((k) => k + 1);
  }

  // ── Render ──────────────────────────────────

  const canCreate = role === "ADMIN" || role === "ANALYST";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Feedback Inbox
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {pagination.total} total records
              </p>
            </div>
            {canCreate && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCsvUpload(!showCsvUpload)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                >
                  {showCsvUpload ? "Hide Upload" : "Import CSV"}
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Add Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* CSV Upload Section */}
        {showCsvUpload && canCreate && (
          <div className="mb-6">
            <CsvUpload onImportComplete={handleImportComplete} />
          </div>
        )}

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={() => fetchFeedback(1)}
        />

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Feedback List */}
        <div className="mt-4">
          <FeedbackList
            feedback={feedback}
            loading={loading}
            onSelect={setSelectedFeedback}
            userRole={role}
          />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

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
