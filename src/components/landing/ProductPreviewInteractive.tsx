"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface ProductPreviewProps {
  mouseRef: React.RefObject<{ x: number; y: number }>;
}

export function ProductPreviewInteractive({ mouseRef }: ProductPreviewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "neg" | "pos">("all");
  const cardRef = useRef<HTMLDivElement>(null);
  // rAF ref prevents scheduling multiple frames on rapid mousemove
  const rafRef = useRef<number | null>(null);

  // Throttle 3D tilt to one rAF frame — prevents per-pixel-move layout thrash
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) return; // Already have a pending frame
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        cardRef.current.style.transform = `perspective(1000px) rotateX(${y * -10}deg) rotateY(${x * 10}deg)`;
      }
      rafRef.current = null;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    }
  }, []);

  const previewFeedback = [
    {
      id: "demo-1",
      content: "The new SSO integration makes onboarding our engineering team effortless.",
      channel: "EMAIL",
      sentiment: "POS",
      sentimentScore: "+0.96",
      status: "ACTIONED",
      customer: "ACME Corp",
      theme: "SSO Auth",
    },
    {
      id: "demo-2",
      content: "Checkout page load time has degraded significantly over the last 48 hours.",
      channel: "SURVEY",
      sentiment: "NEG",
      sentimentScore: "-0.84",
      status: "NEW",
      customer: "Stripe Tier 1",
      theme: "Checkout Latency",
    },
    {
      id: "demo-3",
      content: "Requesting dark mode support for the feedback analytics dashboard overview.",
      channel: "CSV IMPORT",
      sentiment: "NEU",
      sentimentScore: "0.00",
      status: "REVIEWED",
      customer: "Beta User #402",
      theme: "UI Customization",
    },
  ];

  const filtered =
    activeTab === "all"
      ? previewFeedback
      : previewFeedback.filter((item) => item.sentiment.toLowerCase() === activeTab);

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden transition-transform duration-200 ease-out will-change-transform"
      >
        {/* Top Window Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-slate-400 ml-2">
              app.projectloop.io / workspace / feedback
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Workspace Stream
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              All Feedback
            </button>
            <button
              onClick={() => setActiveTab("neg")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "neg"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Negative Only
            </button>
            <button
              onClick={() => setActiveTab("pos")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "pos"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Positive Only
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            3 records loaded
          </span>
        </div>

        {/* Table Rows — AnimatePresence for filter transitions, NO layout prop */}
        {/* Removed Framer Motion `layout` prop: it calls getBoundingClientRect()
            on every render/animation cycle. Simple enter/exit is sufficient here. */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1 max-w-xl">
                  <p className="text-xs sm:text-sm font-medium text-slate-200">
                    {item.content}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>Customer: {item.customer}</span>
                    <span>•</span>
                    <span>Channel: {item.channel}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      item.sentiment === "POS"
                        ? "pos"
                        : item.sentiment === "NEG"
                        ? "neg"
                        : "neu"
                    }
                    size="sm"
                    dot
                  >
                    {item.sentiment} ({item.sentimentScore})
                  </Badge>
                  <Badge
                    variant={
                      item.status === "NEW"
                        ? "new"
                        : item.status === "REVIEWED"
                        ? "reviewed"
                        : "actioned"
                    }
                    size="sm"
                  >
                    {item.status}
                  </Badge>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                    {item.theme}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
