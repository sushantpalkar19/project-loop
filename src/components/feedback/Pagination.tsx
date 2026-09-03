"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRecords?: number;
  pageSize?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  pageSize = 20,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

  function getPageNumbers(): (number | "...")[] {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, "...", safeTotalPages];
    }

    if (safeCurrentPage >= safeTotalPages - 2) {
      return [
        1,
        "...",
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      safeTotalPages,
    ];
  }

  const startItem = totalRecords ? (safeCurrentPage - 1) * pageSize + 1 : undefined;
  const endItem = totalRecords
    ? Math.min(safeCurrentPage * pageSize, totalRecords)
    : undefined;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 sm:px-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
      {/* Page Info */}
      <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
        {totalRecords && startItem && endItem ? (
          <span>
            Showing <span className="font-bold text-slate-900">{startItem}</span>-
            <span className="font-bold text-slate-900">{endItem}</span> of{" "}
            <span className="font-bold text-slate-900">{totalRecords}</span> items
          </span>
        ) : (
          <span>
            Page <span className="font-bold text-slate-900">{safeCurrentPage}</span> of{" "}
            <span className="font-bold text-slate-900">{safeTotalPages}</span>
          </span>
        )}
      </div>

      {/* Pagination Actions */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <Button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          variant="outline"
          size="sm"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="h-8 text-xs font-semibold"
          aria-label="Go to previous page"
        >
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="w-7 h-8 flex items-center justify-center text-xs text-slate-400 select-none font-bold"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                aria-current={safeCurrentPage === page ? "page" : undefined}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 ${
                  safeCurrentPage === page
                    ? "bg-indigo-600 text-white shadow-xs focus:ring-2 focus:ring-indigo-500/20"
                    : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <Button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          variant="outline"
          size="sm"
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="h-8 text-xs font-semibold"
          aria-label="Go to next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
