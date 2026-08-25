"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, AlertCircle, ThumbsUp, Tag } from "lucide-react";

// Entrance: opacity + translateY, one-shot (no bidirectional useInView toggle).
// The old useInView approach caused cards to reset to opacity:0 whenever the hero
// scrolled off-screen, then slowly reappear with up to 1.5s stagger on scroll-back.
// That produced the "hero elements disappearing and reappearing" blank phase.
//
// Fix: entrance is unconditional. Cards animate in once on mount and stay visible.
// Idle float uses pure CSS @keyframes (GPU-composited, zero JS per frame).

export function FloatingFeedbackSignals() {
  const signals = [
    {
      id: "signal-1",
      rawText: "Checkout flow is extremely slow",
      transformedTag: "NEG -0.84 · Theme: Performance",
      icon: AlertCircle,
      pos: { top: "14%", left: "0%" },
      delay: 0.9,
      floatClass: "float-signal-a",
    },
    {
      id: "signal-2",
      rawText: "Love the new dashboard UX!",
      transformedTag: "POS +0.94 · Theme: UI Design",
      icon: ThumbsUp,
      pos: { top: "11%", right: "0%" },
      delay: 1.05,
      floatClass: "float-signal-b",
    },
    {
      id: "signal-3",
      rawText: "Need dark mode support for mobile",
      transformedTag: "NEU 0.00 · Theme: Feature Request",
      icon: Tag,
      pos: { bottom: "18%", left: "0%" },
      delay: 1.2,
      floatClass: "float-signal-a",
    },
    {
      id: "signal-4",
      rawText: "Support team resolved my issue fast",
      transformedTag: "POS +0.89 · Theme: Customer Support",
      icon: Sparkles,
      pos: { bottom: "16%", right: "0%" },
      delay: 1.35,
      floatClass: "float-signal-b",
    },
  ];

  return (
    <>
      {/* CSS keyframes for idle float — GPU-composited, zero JS per frame */}
      <style>{`
        @keyframes float-a {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(8px); }
        }
        .float-signal-a { animation: float-a 5s ease-in-out infinite; }
        .float-signal-b { animation: float-b 5.5s ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <motion.div
              key={sig.id}
              // One-shot entrance — no useInView toggle.
              // Cards animate in once and remain visible regardless of scroll position.
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: sig.delay,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`absolute hidden sm:flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md shadow-xl text-xs max-w-[200px] ${sig.floatClass}`}
              style={sig.pos}
            >
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">&quot;{sig.rawText}&quot;</span>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 w-fit">
                <Icon className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>{sig.transformedTag}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
