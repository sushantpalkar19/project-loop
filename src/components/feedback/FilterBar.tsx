"use client";

import { useState } from "react";
import { Search, Filter, RotateCcw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-picker";
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
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
  }

  function handleApply() {
    onFilterChange(localFilters);
    onApply();
  }

  function handleRemoveSingleFilter(key: keyof Filters) {
    const updated = { ...localFilters, [key]: "" };
    setLocalFilters(updated);
    onFilterChange(updated);
    onApply();
  }

  function handleClearAll() {
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

  function handleDateRangeChange({ startDate, endDate }: { startDate: string; endDate: string }) {
    const updated = { ...localFilters, dateFrom: startDate, dateTo: endDate };
    setLocalFilters(updated);
    onFilterChange(updated);
    onApply();
  }

  // Count active filters
  const activeCount = Object.values(filters).filter((val) => Boolean(val)).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Search & Triage Customer Feedback
          </h3>
          {activeCount > 0 && (
            <Badge variant="primary" size="sm" className="ml-2 font-bold">
              {activeCount} Active Filter{activeCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear all
          </button>
        )}
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
            placeholder="Search feedback text..."
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

        {/* Action button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleApply}
            variant="primary"
            size="sm"
            className="flex-1 h-9"
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Theme and Date Range Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100/80">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <label htmlFor="themeId" className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Theme:
          </label>
          <select
            id="themeId"
            value={localFilters.themeId}
            onChange={(e) => handleChange("themeId", e.target.value)}
            className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All theme topic clusters</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <DateRangePicker
          startDate={localFilters.dateFrom}
          endDate={localFilters.dateTo}
          onChange={handleDateRangeChange}
          onClear={() => handleDateRangeChange({ startDate: "", endDate: "" })}
        />
      </div>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400">Active filters:</span>
          {filters.search && (
            <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-800 border-slate-200">
              Query: &quot;{filters.search}&quot;
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-rose-600 shrink-0"
                onClick={() => handleRemoveSingleFilter("search")}
              />
            </Badge>
          )}
          {filters.channel && (
            <Badge variant="neutral" size="sm" className="capitalize bg-slate-100 text-slate-800 border-slate-200">
              Channel: {filters.channel}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-rose-600 shrink-0"
                onClick={() => handleRemoveSingleFilter("channel")}
              />
            </Badge>
          )}
          {filters.sentiment && (
            <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-800 border-slate-200">
              Sentiment: {SENTIMENT_LABELS[filters.sentiment as keyof typeof SENTIMENT_LABELS] || filters.sentiment}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-rose-600 shrink-0"
                onClick={() => handleRemoveSingleFilter("sentiment")}
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-800 border-slate-200">
              Status: {filters.status}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-rose-600 shrink-0"
                onClick={() => handleRemoveSingleFilter("status")}
              />
            </Badge>
          )}
          {filters.themeId && (
            <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-800 border-slate-200">
              Theme: {themes.find((t) => t.id === filters.themeId)?.name || filters.themeId}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-rose-600 shrink-0"
                onClick={() => handleRemoveSingleFilter("themeId")}
              />
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-800 border-slate-200">
              From: {filters.dateFrom}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-rose-600 shrink-0"
                onClick={() => handleRemoveSingleFilter("dateFrom")}
              />
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-800 border-slate-200">
              To: {filters.dateTo}
              <X
                className="w-3 h-3 ml-1 cursor-pointer hover:text-rose-600 shrink-0"
                onClick={() => handleRemoveSingleFilter("dateTo")}
              />
            </Badge>
          )}
          <button
            onClick={handleClearAll}
            className="text-[11px] text-rose-600 hover:text-rose-800 font-bold ml-1 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
