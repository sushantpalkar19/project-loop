"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare, Calendar, User, Hash } from "lucide-react";

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

interface FeedbackListProps {
  feedback: FeedbackItem[];
  loading: boolean;
  onSelect: (feedback: FeedbackItem) => void;
  userRole?: string;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function FeedbackList({
  feedback,
  loading,
  onSelect,
}: FeedbackListProps) {
  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  if (feedback.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-8 h-8 text-slate-400" />}
        title="No feedback signals found"
        description="There are no customer feedback records matching your current filter criteria or inbox."
      />
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[45%]">Feedback Signal</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Themes / Labels</TableHead>
              <TableHead className="text-right">Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => onSelect(item)}
                className="group hover:bg-slate-50/80 transition-colors"
              >
                <TableCell className="font-medium text-slate-900 py-3.5">
                  <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed font-semibold">
                    {item.content}
                  </p>
                  {item.shortSummary && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 bg-slate-50 border border-slate-200/60 rounded px-2 py-0.5 w-fit">
                      <span className="font-bold text-indigo-600 mr-1">AI Summary:</span>
                      {item.shortSummary}
                    </p>
                  )}
                  {item.sourceRef && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                      <Hash className="w-3 h-3 text-slate-400" />
                      {item.sourceRef}
                    </span>
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  <Badge variant="neutral" size="sm" className="font-mono uppercase">
                    {item.channel}
                  </Badge>
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  <Badge
                    variant={
                      item.sentiment === "POS"
                        ? "pos"
                        : item.sentiment === "NEG"
                        ? "neg"
                        : "neu"
                    }
                    size="sm"
                    dot
                  >
                    {item.sentiment}
                  </Badge>
                </TableCell>

                <TableCell className="whitespace-nowrap">
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

                <TableCell>
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {item.customerLabel && (
                      <Badge variant="purple" size="sm">
                        <User className="w-3 h-3 mr-1" />
                        {item.customerLabel}
                      </Badge>
                    )}
                    {item.themes?.map((t) => (
                      <span
                        key={t.theme.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                        style={{
                          backgroundColor: t.theme.color + "15",
                          color: t.theme.color,
                          borderColor: t.theme.color + "30",
                        }}
                      >
                        {t.theme.name}
                      </span>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="text-right text-xs text-slate-500 whitespace-nowrap font-mono">
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Stack View */}
      <div className="md:hidden space-y-3">
        {feedback.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs active:bg-slate-50 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant="neutral" size="sm" className="font-mono uppercase">
                {item.channel}
              </Badge>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={
                    item.sentiment === "POS"
                      ? "pos"
                      : item.sentiment === "NEG"
                      ? "neg"
                      : "neu"
                  }
                  size="sm"
                  dot
                >
                  {item.sentiment}
                </Badge>
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
              </div>
            </div>

            <p className="text-xs text-slate-900 line-clamp-3 leading-relaxed font-medium">
              {item.content}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              {item.customerLabel && (
                <span className="font-mono text-purple-600">
                  {item.customerLabel}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
