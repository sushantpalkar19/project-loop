"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs",
        className
      )}
    >
      <div className="space-y-1">
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
