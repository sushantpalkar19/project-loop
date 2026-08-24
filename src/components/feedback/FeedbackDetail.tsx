"use client";

import { useState } from "react";

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

interface FeedbackDetailProps {
  feedback: FeedbackItem;
  userRole?: string;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["REVIEWED"],
  REVIEWED: ["ACTIONED"],
  ACTIONED: [],
};

export default function FeedbackDetail({
  feedback,
  userRole,
  onClose,
  onUpdated,
  onDeleted,
}: FeedbackDetailProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = userRole === "ADMIN" || userRole === "ANALYST";
  const nextStatuses = STATUS_TRANSITIONS[feedback.status] || [];

  // ── Update Status ───────────────────────────

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  // ── Delete Feedback ─────────────────────────

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete feedback");
      }

      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  // ── Sentiment Color ─────────────────────────

  function sentimentColor(sentiment: string): string {
    switch (sentiment) {
      case "POS":
        return "bg-green-100 text-green-800";
      case "NEG":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function statusColor(status: string): string {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "REVIEWED":
        return "bg-yellow-100 text-yellow-800";
      case "ACTIONED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // ── Render ──────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Feedback Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(feedback.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Status & Sentiment */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor(feedback.status)}`}>
              {feedback.status}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sentimentColor(feedback.sentiment)}`}>
              {feedback.sentiment} ({feedback.sentimentScore.toFixed(2)})
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {feedback.channel}
            </span>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Content</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{feedback.content}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {feedback.sourceRef && (
              <div>
                <span className="text-gray-500">Source Ref:</span>
                <span className="ml-2 text-gray-900">{feedback.sourceRef}</span>
              </div>
            )}
            {feedback.customerLabel && (
              <div>
                <span className="text-gray-500">Customer:</span>
                <span className="ml-2 text-gray-900">{feedback.customerLabel}</span>
              </div>
            )}
          </div>

          {/* Themes */}
          {feedback.themes && feedback.themes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Themes</h3>
              <div className="flex flex-wrap gap-2">
                {feedback.themes.map((t) => (
                  <span
                    key={t.theme.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: t.theme.color + "20",
                      color: t.theme.color,
                    }}
                  >
                    {t.theme.name} ({Math.round(t.confidence * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status Transitions */}
          {canEdit && nextStatuses.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Change Status
              </h3>
              <div className="flex gap-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Move to {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {canEdit && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
