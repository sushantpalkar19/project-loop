"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => addToast({ type: "success", message, title }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: "error", message, title }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: "info", message, title }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: "warning", message, title }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-200 animate-in slide-in-from-bottom-3 fade-in",
              t.type === "success" && "bg-slate-900 border-slate-800 text-white",
              t.type === "error" && "bg-rose-950 border-rose-800 text-white",
              t.type === "warning" && "bg-amber-950 border-amber-800 text-white",
              t.type === "info" && "bg-slate-900 border-slate-800 text-white"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {t.type === "info" && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0">
              {t.title && <p className="text-xs font-bold leading-tight mb-0.5">{t.title}</p>}
              <p className="text-xs text-slate-200 leading-snug">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-white rounded transition-colors"
              aria-label="Dismiss toast notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
