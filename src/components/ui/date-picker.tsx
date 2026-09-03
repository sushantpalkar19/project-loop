"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  RotateCcw,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (range: { startDate: string; endDate: string }) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
  align?: "right" | "left";
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  onClear,
  className,
  label,
  align = "right",
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

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const presets = [
    {
      label: "Last 7 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return {
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        };
      },
    },
    {
      label: "Last 30 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return {
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        };
      },
    },
    {
      label: "Last 90 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 89);
        return {
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        };
      },
    },
    {
      label: "This Month",
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        };
      },
    },
    {
      label: "Previous Month",
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        };
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

  const handlePresetSelect = (preset: (typeof presets)[0]) => {
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
    <div
      className={cn("relative inline-block text-left", className)}
      ref={containerRef}
    >
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-xl border bg-white shadow-2xs transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 select-none cursor-pointer",
          hasValue
            ? "border-indigo-300 text-indigo-950 bg-indigo-50/40 font-bold"
            : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span className="font-mono">
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
            className="ml-1 p-0.5 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
            title="Clear date filter"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : (
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-0.5",
              isOpen && "rotate-180 text-indigo-600"
            )}
          />
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute mt-2 w-[360px] sm:w-[380px] max-w-[calc(100vw-32px)] rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-4 sm:p-5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4",
            align === "right" ? "right-0" : "left-0"
          )}
          role="dialog"
          aria-label="Select reporting period"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              Select Reporting Period
            </span>

            {hasValue && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p, idx) => {
                const isSelected = activePreset === p.label;
                const isLast = idx === presets.length - 1 && presets.length % 2 !== 0;

                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-left",
                      isLast && "col-span-2 sm:col-span-1",
                      isSelected
                        ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs"
                        : "border-slate-200/80 bg-slate-50/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900"
                    )}
                  >
                    <span>{p.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Input Range */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              Custom Range
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 font-semibold block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => {
                    setTempStart(e.target.value);
                    setActivePreset(null);
                  }}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 font-semibold block">
                  End Date
                </label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => {
                    setTempEnd(e.target.value);
                    setActivePreset(null);
                  }}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-[11px] font-medium text-rose-600 mt-1 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1">
                {error}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Clear
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApply}
                className="h-8 text-xs font-bold"
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
