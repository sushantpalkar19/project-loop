"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "neutral"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "purple"
    | "pos"
    | "neg"
    | "neu"
    | "new"
    | "reviewed"
    | "actioned";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full transition-colors border select-none";

  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",

    // Domain Specific Semantic Variants
    pos: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
    neg: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
    neu: "bg-slate-100 text-slate-700 border-slate-200 font-semibold",

    new: "bg-sky-50 text-sky-700 border-sky-200 font-semibold",
    reviewed: "bg-amber-50 text-amber-700 border-amber-200 font-semibold",
    actioned: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
  };

  const dotColors = {
    default: "bg-slate-500",
    neutral: "bg-slate-500",
    primary: "bg-indigo-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
    purple: "bg-purple-500",
    pos: "bg-emerald-500",
    neg: "bg-rose-500",
    neu: "bg-slate-400",
    new: "bg-sky-500",
    reviewed: "bg-amber-500",
    actioned: "bg-emerald-500",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
