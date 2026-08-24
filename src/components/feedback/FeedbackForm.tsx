"use client";

import { useState } from "react";

interface FeedbackFormProps {
  onClose: () => void;
  onCreated: () => void;
}

const CHANNELS = ["email", "survey", "social", "api", "manual", "chat"];

export default function FeedbackForm({ onClose, onCreated }: FeedbackFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Add Feedback
            </h2>
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

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              rows={4}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter feedback content..."
            />
            {fieldErrors.content && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>
            )}
          </div>

          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-gray-700">
              Channel *
            </label>
            <select
              id="channel"
              name="channel"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select channel</option>
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </option>
              ))}
            </select>
            {fieldErrors.channel && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.channel}</p>
            )}
          </div>

          <div>
            <label htmlFor="sourceRef" className="block text-sm font-medium text-gray-700">
              Source Reference
            </label>
            <input
              id="sourceRef"
              name="sourceRef"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., TKT-1001, TWEET-2001"
            />
          </div>

          <div>
            <label htmlFor="customerLabel" className="block text-sm font-medium text-gray-700">
              Customer Label
            </label>
            <input
              id="customerLabel"
              name="customerLabel"
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., CUST-001"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
