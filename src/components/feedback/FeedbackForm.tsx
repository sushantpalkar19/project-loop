"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertCircle, Plus, Sparkles } from "lucide-react";
import { FEEDBACK_CHANNELS } from "@/lib/constants";

interface FeedbackFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function FeedbackForm({ onClose, onCreated }: FeedbackFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [contentLength, setContentLength] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      content: formData.get("content") as string,
      channel: formData.get("channel") as string,
      sourceRef: (formData.get("sourceRef") as string) || undefined,
      customerLabel: (formData.get("customerLabel") as string) || undefined,
    };

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.details) {
          setFieldErrors(responseData.details);
        } else {
          setError(responseData.error || "Failed to create feedback");
        }
        return;
      }

      onCreated();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Create Feedback Signal"
      subtitle="Add customer feedback for sentiment analysis and thematic categorization"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="content"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Feedback Content *
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {contentLength} chars
            </span>
          </div>
          <textarea
            id="content"
            name="content"
            rows={4}
            required
            onChange={(e) => setContentLength(e.target.value.length)}
            className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            placeholder="Type or paste customer feedback content..."
          />
          {fieldErrors.content && (
            <p className="text-xs font-medium text-rose-600">
              {fieldErrors.content}
            </p>
          )}
        </div>

        <Select
          id="channel"
          name="channel"
          required
          label="Ingestion Channel *"
          error={fieldErrors.channel}
          className="text-xs"
        >
          <option value="">Select channel...</option>
          {FEEDBACK_CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="sourceRef"
            name="sourceRef"
            type="text"
            label="Source Reference (Optional)"
            placeholder="e.g. TKT-1001, TWEET-402"
            className="text-xs"
          />

          <Input
            id="customerLabel"
            name="customerLabel"
            type="text"
            label="Customer Label (Optional)"
            placeholder="e.g. CUST-809, ACME Corp"
            className="text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Signal
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
