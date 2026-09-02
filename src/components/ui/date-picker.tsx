"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (range: { startDate: string; endDate: string }) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  onClear,
  className,
  label,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presets = [
    {
      label: "Last 7 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      },
    },
    {
      label: "Last 30 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      },
    },
    {
      label: "Last 90 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 89);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      },
    },
    {
      label: "This Month",
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      },
    },
    {
      label: "Previous Month",
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      },
    },
  ];

  const handleApply = () => {
    setError(null);
    if (tempStart && tempEnd && tempStart > tempEnd) {
      setError("Start date cannot be after end date.");
      return;
    }
    onChange({ startDate: tempStart, endDate: tempEnd });
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: typeof presets[0]) => {
    const val = preset.getValue();
    setTempStart(val.startDate);
    setTempEnd(val.endDate);
    setActivePreset(preset.label);
    setError(null);
    onChange(val);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStart("");
    setTempEnd("");
    setActivePreset(null);
    setError(null);
    if (onClear) onClear();
    else onChange({ startDate: "", endDate: "" });
    setIsOpen(false);
  };

  const hasValue = Boolean(startDate || endDate);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-lg border bg-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600",
          hasValue ? "border-indigo-300 text-indigo-950 font-semibold" : "border-slate-300 text-slate-700 hover:bg-slate-50"
        )}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span>
          {startDate && endDate
            ? `${startDate} → ${endDate}`
            : startDate
            ? `From ${startDate}`
            : endDate
            ? `Until ${endDate}`
            : "Select Date Range"}
        </span>

        {hasValue ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="ml-1 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700"
            title="Clear date filter"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronRight className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ml-1", isOpen && "rotate-90")} />
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-2 w-72 sm:w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              Select Reporting Period
            </span>
            {hasValue && (
              <button
                onClick={handleReset}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={cn(
                    "text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border text-slate-700 hover:bg-slate-100 hover:border-slate-300",
                    activePreset === p.label ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold" : "border-slate-200 bg-slate-50/50"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Input Range */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Custom Range
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">Start Date</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => {
                    setTempStart(e.target.value);
                    setActivePreset(null);
                  }}
                  className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">End Date</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => {
                    setTempEnd(e.target.value);
                    setActivePreset(null);
                  }}
                  className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
              </div>
            </div>

            {error && (
              <p className="text-[11px] font-medium text-rose-600 mt-1">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              Apply Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
