"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import LoopCoreScene from "@/components/landing/LoopCoreScene";
import { FloatingFeedbackSignals } from "@/components/landing/FloatingFeedbackSignals";

interface CinematicHeroSequenceProps {
  mouseRef: React.RefObject<{ x: number; y: number }>;
  isReducedMotion?: boolean;
}

export function CinematicHeroSequence({
  mouseRef,
  isReducedMotion = false,
}: CinematicHeroSequenceProps) {
  return (
    <section className="relative pt-16 pb-20 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

        {/* Left Column: Staggered Text Reveal */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

          {/* 0.2s — Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-xs font-semibold text-indigo-300 shadow-inner"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>AI Multi-Tenant Intelligence Engine</span>
          </motion.div>

          {/* 0.4s — Headline Reveal: opacity + translateY only (no blur animation)
              The gradient text itself provides the visual depth/reveal effect.
              Animating filter:blur every frame is the most expensive CSS operation. */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl sm:text-6xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Turn Customer Feedback{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent block mt-1">
                into Actionable Intelligence.
              </span>
            </h1>
          </motion.div>

          {/* 0.8s — Subtitle Fade */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Unify feedback streams across Support, Surveys, Social, and CSV imports. Automatically analyze sentiment, cluster emerging themes, and act on real customer signal.
          </motion.p>

          {/* 1.0s — CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
            >
              Sign In to Workspace
            </Link>
          </motion.div>
        </div>

        {/* Right column: 3D canvas + floating signals
            Canvas uses scale-only entrance (opacity always 1) so WebGL initializes immediately.
            Signals use one-shot entrance with built-in per-card delays (0.9-1.35s). */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[480px] sm:min-h-[520px]">
          {/* Canvas — scale-only entrance, opacity always 1 */}
          <motion.div
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <LoopCoreScene mouseRef={mouseRef} isReducedMotion={isReducedMotion} />
          </motion.div>

          {/* Floating signals — each card has its own entrance delay, no parent wrapper needed */}
          <FloatingFeedbackSignals />
        </div>
      </div>
    </section>
  );
}
