"use client";

import React from "react";
import Link from "next/link";
import { Layers, ShieldCheck } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print mt-auto border-t border-slate-200/80 bg-white/90 backdrop-blur-xs py-5 px-4 sm:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 tracking-tight">
              Project LOOP
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 hidden sm:inline">
              AI Feedback Intelligence Platform
            </span>
          </div>
        </div>

        {/* Quick Nav Links */}
        <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium text-slate-500" aria-label="Footer navigation">
          <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/feedback" className="hover:text-indigo-600 transition-colors">
            Feedback
          </Link>
          <Link href="/trends" className="hover:text-indigo-600 transition-colors">
            Insights
          </Link>
          <Link href="/ask" className="hover:text-indigo-600 transition-colors">
            Ask LOOP
          </Link>
          <Link href="/reports" className="hover:text-indigo-600 transition-colors">
            Reports
          </Link>
        </nav>

        {/* Security + Copyright */}
        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 font-semibold font-sans">
            <ShieldCheck className="w-3 h-3" />
            <span>Isolated Tenant</span>
          </div>
          <span>© {year} Project LOOP</span>
        </div>
      </div>
    </footer>
  );
}
