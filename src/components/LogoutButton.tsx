"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { useLogout } from "@/components/layout/LogoutContext";

export default function LogoutButton() {
  const [localLoading, setLocalLoading] = useState(false);

  let logoutCtx: { isLoggingOut: boolean; handleLogout: () => Promise<void> } | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    logoutCtx = useLogout();
  } catch {
    logoutCtx = null;
  }

  const isLoggingOut = logoutCtx ? logoutCtx.isLoggingOut : localLoading;

  async function handleLogout() {
    if (logoutCtx) {
      await logoutCtx.handleLogout();
    } else {
      setLocalLoading(true);
      try {
        await signOut({ callbackUrl: "/login" });
      } catch {
        setLocalLoading(false);
      }
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/80 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs select-none"
      aria-busy={isLoggingOut}
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
          <span>Signing out…</span>
        </>
      ) : (
        <>
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </>
      )}
    </button>
  );
}
