"use client";

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

interface FeedbackListProps {
  feedback: FeedbackItem[];
  loading: boolean;
  onSelect: (feedback: FeedbackItem) => void;
  userRole?: string;
}

// ── Helpers ───────────────────────────────────

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

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// ── Component ─────────────────────────────────

export default function FeedbackList({
  feedback,
  loading,
  onSelect,
}: FeedbackListProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading feedback...</p>
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <p className="text-gray-500">No feedback found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {feedback.map((item) => (
          <li
            key={item.id}
            className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 line-clamp-2">
                  {truncate(item.content, 150)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {item.channel}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sentimentColor(item.sentiment)}`}
                  >
                    {item.sentiment}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                  {item.customerLabel && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {item.customerLabel}
                    </span>
                  )}
                  {item.themes?.map((t) => (
                    <span
                      key={t.theme.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: t.theme.color + "20",
                        color: t.theme.color,
                      }}
                    >
                      {t.theme.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="ml-4 text-right text-xs text-gray-500 whitespace-nowrap">
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
