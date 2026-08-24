"use client";

import { useState } from "react";

interface Filters {
  search: string;
  channel: string;
  sentiment: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onApply: () => void;
}

const CHANNELS = ["email", "survey", "social", "api", "manual", "chat"];
const SENTIMENTS = ["POS", "NEU", "NEG"];
const STATUSES = ["NEW", "REVIEWED", "ACTIONED"];

export default function FilterBar({ filters, onFilterChange, onApply }: FilterBarProps) {
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
    <div className="bg-white shadow rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={localFilters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search feedback content..."
          />
        </div>

        {/* Channel */}
        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-gray-700">
            Channel
          </label>
          <select
            id="channel"
            value={localFilters.channel}
            onChange={(e) => handleChange("channel", e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All channels</option>
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {ch.charAt(0).toUpperCase() + ch.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Sentiment */}
        <div>
          <label htmlFor="sentiment" className="block text-sm font-medium text-gray-700">
            Sentiment
          </label>
          <select
            id="sentiment"
            value={localFilters.sentiment}
            onChange={(e) => handleChange("sentiment", e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All sentiments</option>
            {SENTIMENTS.map((s) => (
              <option key={s} value={s}>
                {s === "POS" ? "Positive" : s === "NEG" ? "Negative" : "Neutral"}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={localFilters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
            From Date
          </label>
          <input
            id="dateFrom"
            type="date"
            value={localFilters.dateFrom}
            onChange={(e) => handleChange("dateFrom", e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">
            To Date
          </label>
          <input
            id="dateTo"
            type="date"
            value={localFilters.dateTo}
            onChange={(e) => handleChange("dateTo", e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
