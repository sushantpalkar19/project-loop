"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Layers, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface LogoutContextType {
  isLoggingOut: boolean;
  handleLogout: () => Promise<void>;
}

const LogoutContext = createContext<LogoutContextType | undefined>(undefined);

export function LogoutProvider({ children }: { children: React.ReactNode }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { error: toastError } = useToast();

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // Trigger NextAuth signOut with login callback
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      setIsLoggingOut(false);
      const msg = err instanceof Error ? err.message : "Failed to sign out. Please try again.";
      toastError(msg, "Logout Failed");
    }
  }, [isLoggingOut, toastError]);

  return (
    <LogoutContext.Provider value={{ isLoggingOut, handleLogout }}>
      {/* Container wrapper that applies page-level fade during logout */}
      <div
        className={`transition-all duration-400 ease-out ${
          isLoggingOut
            ? "opacity-50 pointer-events-none select-none scale-[0.995] filter blur-[0.5px] motion-reduce:opacity-100 motion-reduce:scale-100 motion-reduce:blur-none"
            : ""
        }`}
      >
        {children}
      </div>

      {/* Cinematic Logout Overlay */}
      {isLoggingOut && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-300 motion-reduce:animate-none"
          role="status"
          aria-live="polite"
          aria-label="Signing out of workspace"
        >
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 flex flex-col items-center text-center space-y-4 max-w-xs w-full animate-in zoom-in-95 duration-300 motion-reduce:animate-none">
            {/* LOOP Brand Badge */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex items-center justify-center shadow-lg ring-4 ring-indigo-500/20 animate-pulse motion-reduce:animate-none">
                <Layers className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
              </div>
            </div>

            {/* Status Copy */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Signing out…
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Securing workspace session &amp; returning to login
              </p>
            </div>
          </div>
        </div>
      )}
    </LogoutContext.Provider>
  );
}

export function useLogout() {
  const context = useContext(LogoutContext);
  if (!context) {
    throw new Error("useLogout must be used within a LogoutProvider");
  }
  return context;
}
