"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, Filter, TrendingUp, Bot, Terminal } from "lucide-react";

export function FeaturesInteractive() {
  // ── Typing effect via DOM ref mutation — ZERO React re-renders per tick ───
  // Previously: setInterval + setTypedText → ~16 setState calls/second → 16
  // React re-renders/second of this entire component while scrolling.
  // Now: we write directly to a span's textContent. React state is never touched.
  const typingRef = useRef<HTMLSpanElement>(null);
  const fullPrompt = "What are top customer complaints regarding checkout velocity this week?";

  useEffect(() => {
    let index = 0;
    let forward = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!typingRef.current) return;

      if (forward) {
        index++;
        typingRef.current.textContent = fullPrompt.slice(0, index);
        if (index >= fullPrompt.length) {
          forward = false;
          timeoutId = setTimeout(tick, 3000); // Pause at full text
          return;
        }
      } else {
        index = 0;
        forward = true;
        typingRef.current.textContent = "";
      }

      timeoutId = setTimeout(tick, 60);
    };

    timeoutId = setTimeout(tick, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Feature 1: Sentiment Scoring */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Sentiment Scoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automated POS / NEG / NEU sentiment analysis with explicit confidence metrics per record.
          </p>
        </div>

        {/* Bar chart — scaleY instead of height so no layout recalc per frame */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-4">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Stream Sentiment</span>
            <span className="text-emerald-400 font-bold">POS (89%)</span>
          </div>
          <div className="flex items-end gap-1.5 h-6">
            {[40, 75, 30, 95, 60, 85, 45, 90, 70, 100].map((h, i) => (
              <motion.div
                key={i}
                // scaleY is GPU-composited; height is a layout property.
                // transformOrigin bottom so bars grow upward.
                animate={{ scaleY: [h / 100, (100 - h) / 100, h / 100] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                className="flex-1 bg-gradient-to-t from-indigo-500 to-emerald-400 rounded-full origin-bottom"
                style={{ height: "100%" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feature 2: Theme Clustering */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Theme Clustering</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Discover recurring pain points and feature requests automatically grouped into clusters.
          </p>
        </div>

        {/* Clustering nodes — scale only (no layout props) */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-4 min-h-[72px] flex items-center justify-center relative overflow-hidden">
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-wrap gap-1.5 justify-center"
          >
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
              SSO Auth (42)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
              Latency (28)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
              CSV Export (16)
            </span>
          </motion.div>
        </div>
      </div>

      {/* Feature 3: Trend Intelligence */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-lg">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Trend Intelligence</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Identify emerging volume surges before they impact customer satisfaction and churn.
          </p>
        </div>

        {/* SVG path animation — composited, no layout impact */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-4 overflow-hidden">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>Volume Spike</span>
            <span className="text-amber-400 font-bold">+34% Surge</span>
          </div>
          <svg className="w-full h-8 stroke-amber-400 fill-none stroke-[2]" viewBox="0 0 100 30">
            <motion.path
              d="M0,25 Q20,20 40,22 T80,5 T100,2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </div>

      {/* Feature 4: Ask LOOP AI */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Ask LOOP AI</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Query your feedback repository in natural language for instant conversational insight.
          </p>
        </div>

        {/* Typing box — DOM-mutated via ref, zero React state updates */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 mt-4 min-h-[72px]">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400">
            <Terminal className="w-3 h-3" />
            <span>Ask LOOP Query:</span>
          </div>
          <p className="text-[11px] font-mono text-slate-300 line-clamp-2">
            {/* ref-based typing — textContent updated imperatively */}
            <span ref={typingRef} />
            <span className="animate-ping">|</span>
          </p>
        </div>
      </div>
    </div>
  );
}
