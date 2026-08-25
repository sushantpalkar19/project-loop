"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, ArrowRight, Calendar, User, Hash, Tag, Sparkles, Zap } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [detail, setDetail] = useState<FeedbackItem>(feedback);

  const canEdit = userRole === "ADMIN" || userRole === "ANALYST";
  const nextStatuses = STATUS_TRANSITIONS[detail.status] || [];

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

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this feedback signal?")) {
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

  async function handleReclassify() {
    setClassifying(true);
    setClassifyError(null);

    try {
      const response = await fetch(`/api/feedback/${feedback.id}/classify`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Classification failed");
      }

      // Update the detail with the fresh feedback data from the API
      if (data.feedback) {
        setDetail(data.feedback);
      }

      // Notify parent to refresh list data
      onUpdated();
    } catch (err) {
      setClassifyError(
        err instanceof Error ? err.message : "Classification failed"
      );
    } finally {
      setClassifying(false);
    }
  }

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Feedback Signal Details"
      subtitle={`Created ${new Date(feedback.createdAt).toLocaleString()}`}
      maxWidth="xl"
    >
      <div className="p-6 space-y-5">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              detail.status === "NEW"
                ? "new"
                : detail.status === "REVIEWED"
                ? "reviewed"
                : "actioned"
            }
            size="md"
          >
            Workflow: {detail.status}
          </Badge>

          <Badge
            variant={
              detail.sentiment === "POS"
                ? "pos"
                : detail.sentiment === "NEG"
                ? "neg"
                : "neu"
            }
            size="md"
            dot
          >
            Sentiment: {detail.sentiment} (Score: {detail.sentimentScore.toFixed(2)})
          </Badge>

          <Badge
            variant={
              detail.urgency === "CRITICAL"
                ? "neg"
                : detail.urgency === "HIGH"
                ? "neg"
                : detail.urgency === "MEDIUM"
                ? "reviewed"
                : "neutral"
            }
            size="md"
          >
            Urgency: {detail.urgency}
          </Badge>

          <Badge variant="neutral" size="md" className="font-mono uppercase">
            Channel: {detail.channel}
          </Badge>
        </div>

        {/* Content Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Feedback Text
          </span>
          <p className="text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-wrap font-normal">
            {detail.content}
          </p>
        </div>

        {/* AI Summary Section */}
        <div className="bg-indigo-50/40 border border-indigo-100/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              AI Analysis
            </span>
          </div>

          {/* Short Summary */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Summary
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {detail.shortSummary || (
                <span className="text-slate-400 italic">No AI summary available.</span>
              )}
            </p>
          </div>

          {/* Confidence */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Confidence: </span>
              <span className="font-semibold text-slate-800">
                {detail.confidence != null ? `${Math.round(detail.confidence * 100)}%` : (
                  <span className="text-slate-400 italic">No confidence score available.</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white border border-slate-200/60 rounded-xl p-4">
          <div className="space-y-1">
            <span className="text-slate-500 font-medium block">Source Reference:</span>
            <p className="font-mono text-slate-800 font-semibold">
              {detail.sourceRef || "None provided"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-medium block">Customer Label:</span>
            <p className="font-semibold text-purple-700">
              {detail.customerLabel || "Unlabeled"}
            </p>
          </div>
        </div>

        {/* Themes Section */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Categorized Themes
          </span>
          {detail.themes && detail.themes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {detail.themes.map((t) => (
                <span
                  key={t.theme.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold border shadow-2xs"
                  style={{
                    backgroundColor: t.theme.color + "15",
                    color: t.theme.color,
                    borderColor: t.theme.color + "30",
                  }}
                >
                  <Tag className="w-3 h-3" />
                  <span>{t.theme.name}</span>
                  <span className="text-[10px] opacity-75 font-mono ml-1">
                    ({Math.round(t.confidence * 100)}% match)
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No themes identified.</p>
          )}
        </div>

        {/* Reclassify with AI — ADMIN/ANALYST only */}
        {canEdit && (
          <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-900 block">
                AI Classification
              </span>
              <Button
                onClick={handleReclassify}
                isLoading={classifying}
                disabled={classifying}
                variant="outline"
                size="sm"
                leftIcon={<Zap className="w-3.5 h-3.5" />}
                className="border-violet-200 text-violet-700 hover:bg-violet-100"
              >
                {classifying ? "Classifying..." : "Reclassify with AI"}
              </Button>
            </div>
            {classifyError && (
              <div className="flex items-center gap-2 text-rose-600 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{classifyError}</span>
              </div>
            )}
          </div>
        )}

        {/* Status Transition Action */}
        {canEdit && nextStatuses.length > 0 && (
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <span className="text-xs font-semibold text-indigo-900 block">
              Advance Workflow Status
            </span>
            <div className="flex gap-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  isLoading={loading}
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Move to {status}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {canEdit && (
              <Button
                onClick={handleDelete}
                isLoading={loading}
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Signal
              </Button>
            )}
          </div>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
