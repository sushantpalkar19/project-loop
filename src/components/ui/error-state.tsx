"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Unable to load data",
  message = "We encountered a temporary problem retrieving your workspace information. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-rose-50/60 border border-rose-200/80 p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs max-w-md mx-auto my-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shadow-xs">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-rose-950">{title}</h3>
        <p className="text-xs text-rose-800/80 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-rose-200 text-rose-800 hover:bg-rose-100 mt-2"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
