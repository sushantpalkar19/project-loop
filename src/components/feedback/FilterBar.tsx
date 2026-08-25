"use client";

import { useState } from "react";
import { Search, Filter, RotateCcw, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FEEDBACK_CHANNELS, SENTIMENTS, FEEDBACK_STATUSES, SENTIMENT_LABELS } from "@/lib/constants";

interface ThemeOption {
  id: string;
  name: string;
  color: string;
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

interface FilterBarProps {
  filters: Filters;
  themes?: ThemeOption[];
  onFilterChange: (filters: Filters) => void;
  onApply: () => void;
}



export default function FilterBar({ filters, themes = [], onFilterChange, onApply }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  function handleChange(key: keyof Filters, value: string) {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleApply() {
    onFilterChange(localFilters);
    onApply();
  }

  function handleClear() {
    const empty: Filters = {
      search: "",
      channel: "",
      sentiment: "",
      status: "",
      themeId: "",
      dateFrom: "",
      dateTo: "",
    };
    setLocalFilters(empty);
    onFilterChange(empty);
    onApply();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleApply();
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Filter className="w-4 h-4 text-indigo-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Filter & Search Feedback Signals
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-2">
          <Input
            id="search"
            value={localFilters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            onKeyDown={handleKeyDown}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            placeholder="Search feedback content..."
            className="h-9 text-xs"
          />
        </div>

        {/* Channel */}
        <div>
          <Select
            id="channel"
            value={localFilters.channel}
            onChange={(e) => handleChange("channel", e.target.value)}
            className="h-9 text-xs"
          >
            <option value="">All channels</option>
            {FEEDBACK_CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {ch.charAt(0).toUpperCase() + ch.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        {/* Sentiment */}
        <div>
          <Select
            id="sentiment"
            value={localFilters.sentiment}
            onChange={(e) => handleChange("sentiment", e.target.value)}
            className="h-9 text-xs"
          >
            <option value="">All sentiments</option>
            {SENTIMENTS.map((s) => (
              <option key={s} value={s}>
                {SENTIMENT_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        {/* Status */}
        <div>
          <Select
            id="status"
            value={localFilters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="h-9 text-xs"
          >
            <option value="">All statuses</option>
            {FEEDBACK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleApply}
            variant="primary"
            size="sm"
            className="flex-1 h-9"
          >
            Apply
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            className="h-9 px-2.5"
            title="Clear filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Date Range Optional Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100/80">
        <div>
          <label htmlFor="themeId" className="block text-[11px] font-medium text-slate-500 mb-1">
            Theme
          </label>
          <select
            id="themeId"
            value={localFilters.themeId}
            onChange={(e) => handleChange("themeId", e.target.value)}
            className="flex h-8 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All themes</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dateFrom" className="block text-[11px] font-medium text-slate-500 mb-1">
            From Date
          </label>
          <input
            id="dateFrom"
            type="date"
            value={localFilters.dateFrom}
            onChange={(e) => handleChange("dateFrom", e.target.value)}
            className="flex h-8 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-[11px] font-medium text-slate-500 mb-1">
            To Date
          </label>
          <input
            id="dateTo"
            type="date"
            value={localFilters.dateTo}
            onChange={(e) => handleChange("dateTo", e.target.value)}
            className="flex h-8 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>
    </div>
  );
}
