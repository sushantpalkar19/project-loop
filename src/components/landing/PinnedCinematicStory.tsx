"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MessageSquare, Sparkles, AlertCircle, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PinnedCinematicStoryProps {
  mouseRef: React.RefObject<{ x: number; y: number }>;
  isReducedMotion?: boolean;
}

// ─── CSS-Only LOOP Core Orb ──────────────────────────────────────────────────
// Visually matches the Three.js LoopCoreScene: gradient sphere, glow, dual
// rotating rings, particle haze. GPU-friendly — only uses transform & opacity.
function LoopCoreOrbCSS() {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 340, height: 340 }}
      aria-hidden
    >
      {/* ── Outer ambient glow ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.22) 0%, rgba(168,85,247,0.10) 50%, transparent 75%)",
          filter: "blur(28px)",
        }}
      />

      {/* ── Outer torus ring (indigo, slow clockwise)
           Centered via top/left + negative margin so `transform` is owned
           exclusively by the keyframe animation — no inline transform conflict. */}
      <div
        className="absolute rounded-full border-[2px] border-indigo-500/60 pointer-events-none"
        style={{
          width: 300,
          height: 300,
          top: "50%",
          left: "50%",
          marginTop: -150,
          marginLeft: -150,
          boxShadow:
            "0 0 18px 2px rgba(99,102,241,0.35), inset 0 0 18px 2px rgba(99,102,241,0.15)",
          animation: "loop-ring-outer 6s linear infinite",
        }}
      />

      {/* ── Inner torus ring (purple, counter-clockwise, tilted)
           Same margin-offset centering. */}
      <div
        className="absolute rounded-full border-[1.5px] border-purple-500/50 pointer-events-none"
        style={{
          width: 230,
          height: 230,
          top: "50%",
          left: "50%",
          marginTop: -115,
          marginLeft: -115,
          boxShadow:
            "0 0 14px 2px rgba(168,85,247,0.30), inset 0 0 14px 2px rgba(168,85,247,0.12)",
          animation: "loop-ring-inner 4s linear infinite reverse",
        }}
      />

      {/* ── Central sphere (icosahedron-like gradient + wireframe feel) ── */}
      <div
        className="relative z-10 rounded-full"
        style={{
          width: 140,
          height: 140,
          background:
            "radial-gradient(circle at 38% 35%, #38bdf8 0%, #6366f1 40%, #4338ca 70%, #1e1b4b 100%)",
          boxShadow:
            "0 0 40px 8px rgba(99,102,241,0.45), 0 0 80px 20px rgba(56,189,248,0.15)",
          animation: "loop-core-pulse 3s ease-in-out infinite",
        }}
      >
        {/* Wireframe overlay */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(147,197,253,0.25) 18px, rgba(147,197,253,0.25) 19px),
              repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(147,197,253,0.25) 18px, rgba(147,197,253,0.25) 19px)
            `,
          }}
        />
      </div>

      {/* ── Particle haze layer ───────────────────────────────────────── */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(168,85,247,0.06) 0%, transparent 60%)",
          animation: "loop-haze 8s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}

export function PinnedCinematicStory({ isReducedMotion }: PinnedCinematicStoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Raw scrollYProgress — NO useSpring. Scroll is immediately authoritative.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // ── Stage opacities — non-overlapping, zero dead zones ──────────────────
  // Stage 4: 65%→76% fade in, full 76%→100%
  const stage1Opacity = useTransform(scrollYProgress, [0, 0.22, 0.28], [1, 1, 0]);
  const stage2Opacity = useTransform(scrollYProgress, [0.22, 0.28, 0.48, 0.53], [0, 1, 1, 0]);
  const stage3Opacity = useTransform(scrollYProgress, [0.48, 0.53, 0.65, 0.70], [0, 1, 1, 0]);
  const stage4Opacity = useTransform(scrollYProgress, [0.65, 0.74, 1], [0, 1, 1]);

  // ── Signal card transforms — Pixel offsets place cards OUTSIDE the 340px orb at scroll 0 ──
  // Cards converge toward orb center (0,0) as scroll progresses through stage 1 (0 -> 22%)
  const signal1X = useTransform(scrollYProgress, [0, 0.22], ["-260px", "0px"]);
  const signal1Y = useTransform(scrollYProgress, [0, 0.22], ["-130px", "0px"]);
  const signal1Scale = useTransform(scrollYProgress, [0, 0.18, 0.22], [1, 0.85, 0.2]);

  const signal2X = useTransform(scrollYProgress, [0, 0.22], ["260px", "0px"]);
  const signal2Y = useTransform(scrollYProgress, [0, 0.22], ["-110px", "0px"]);
  const signal2Scale = useTransform(scrollYProgress, [0, 0.18, 0.22], [1, 0.85, 0.2]);

  const signal3X = useTransform(scrollYProgress, [0, 0.22], ["-240px", "0px"]);
  const signal3Y = useTransform(scrollYProgress, [0, 0.22], ["140px", "0px"]);
  const signal3Scale = useTransform(scrollYProgress, [0, 0.18, 0.22], [1, 0.85, 0.2]);

  const signal4X = useTransform(scrollYProgress, [0, 0.22], ["240px", "0px"]);
  const signal4Y = useTransform(scrollYProgress, [0, 0.22], ["120px", "0px"]);
  const signal4Scale = useTransform(scrollYProgress, [0, 0.18, 0.22], [1, 0.85, 0.2]);

  // ── Subtle orb scale driven by scroll — applied via CSS orb container only ─
  // One animation owner: the CSS orb div. No fighting with WebGL.
  const orbScale = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [1, 1.12, 1.06, 1.15, 1]);

  return (
    <>
      {/* Inject CSS keyframes for the orb animations */}
      <style>{`
        @keyframes loop-ring-outer {
          from { transform: rotateX(68deg) rotateZ(0deg); }
          to   { transform: rotateX(68deg) rotateZ(360deg); }
        }
        @keyframes loop-ring-inner {
          from { transform: rotateX(55deg) rotateZ(40deg); }
          to   { transform: rotateX(55deg) rotateZ(400deg); }
        }
        @keyframes loop-core-pulse {
          0%, 100% { box-shadow: 0 0 40px 8px rgba(99,102,241,0.45), 0 0 80px 20px rgba(56,189,248,0.15); }
          50%       { box-shadow: 0 0 55px 14px rgba(99,102,241,0.60), 0 0 100px 30px rgba(56,189,248,0.22); }
        }
        @keyframes loop-haze {
          from { opacity: 0.6; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.05); }
        }
      `}</style>

      <div ref={containerRef} className="relative h-[170vh] bg-[#05070d]">
        {/* ── Sticky viewport anchor ──────────────────────────────────── */}
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6">

          {/* Persistent background ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-600/15 blur-[160px] rounded-full pointer-events-none" />

          {/* Dynamic storytelling header */}
          <div className="absolute top-16 z-20 text-center space-y-1.5 px-4">
            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 block">
              Continuous Intelligence Journey
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Raw Customer Signals → LOOP Engine → Actionable Intelligence
            </h2>
          </div>

          {/* ── CSS-only LOOP Core Orb (replaces second Three.js canvas) ── */}
          {/* One animation owner: motion.div scale driven by scrollYProgress only */}
          <motion.div
            style={{ scale: orbScale }}
            className="relative z-10 pointer-events-none flex items-center justify-center"
          >
            {isReducedMotion ? (
              // Static fallback for reduced motion
              <div
                className="rounded-full"
                style={{
                  width: 140,
                  height: 140,
                  background:
                    "radial-gradient(circle at 38% 35%, #38bdf8 0%, #6366f1 40%, #4338ca 70%, #1e1b4b 100%)",
                  boxShadow: "0 0 40px 8px rgba(99,102,241,0.45)",
                }}
              />
            ) : (
              <LoopCoreOrbCSS />
            )}
          </motion.div>

          {/* ── STAGE 1: RAW SIGNALS FUNNEL (Scroll 0–22%) ────────────── */}
          <motion.div
            style={{ opacity: stage1Opacity }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
          >
            <div className="text-center absolute bottom-12 text-xs text-indigo-300/80 font-mono animate-pulse">
              ↓ Scroll to Ingest Feedback Signals into the LOOP Core
            </div>

            <motion.div
              style={{ x: signal1X, y: signal1Y, scale: signal1Scale }}
              className="absolute p-3 rounded-xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-md shadow-xl text-xs flex items-center gap-2 max-w-[210px]"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-200 truncate">&quot;Checkout flow is slow&quot;</span>
            </motion.div>

            <motion.div
              style={{ x: signal2X, y: signal2Y, scale: signal2Scale }}
              className="absolute p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 backdrop-blur-md shadow-xl text-xs flex items-center gap-2 max-w-[210px]"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-200 truncate">&quot;Love the new dashboard!&quot;</span>
            </motion.div>

            <motion.div
              style={{ x: signal3X, y: signal3Y, scale: signal3Scale }}
              className="absolute p-3 rounded-xl bg-slate-900/90 border border-slate-700 backdrop-blur-md shadow-xl text-xs flex items-center gap-2 max-w-[210px]"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-200 truncate">&quot;Need dark mode support&quot;</span>
            </motion.div>

            <motion.div
              style={{ x: signal4X, y: signal4Y, scale: signal4Scale }}
              className="absolute p-3 rounded-xl bg-slate-900/90 border border-sky-500/40 backdrop-blur-md shadow-xl text-xs flex items-center gap-2 max-w-[210px]"
            >
              <ThumbsUp className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-slate-200 truncate">&quot;Support resolved issue fast&quot;</span>
            </motion.div>
          </motion.div>

          {/* ── STAGE 2: SENTIMENT CLASSIFICATION (Scroll 25–50%) ──────── */}
          <motion.div
            style={{ opacity: stage2Opacity }}
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-24 z-20 px-6"
          >
            <div className="text-center space-y-1 mt-6">
              <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                STAGE 01 — AUTOMATED SENTIMENT ANALYSIS
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mb-12">
              <div className="p-4 rounded-xl bg-slate-900/95 border border-emerald-500/40 space-y-1.5 text-center shadow-2xl backdrop-blur-md">
                <span className="text-[10px] font-bold text-emerald-400 block font-mono">POSITIVE (POS)</span>
                <p className="text-2xl font-extrabold text-white">+0.94</p>
                <p className="text-[11px] text-slate-300">&quot;Love the new dashboard!&quot;</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/95 border border-slate-700 space-y-1.5 text-center shadow-2xl backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-400 block font-mono">NEUTRAL (NEU)</span>
                <p className="text-2xl font-extrabold text-white">0.00</p>
                <p className="text-[11px] text-slate-300">&quot;Need dark mode support&quot;</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/95 border border-rose-500/40 space-y-1.5 text-center shadow-2xl backdrop-blur-md">
                <span className="text-[10px] font-bold text-rose-400 block font-mono">NEGATIVE (NEG)</span>
                <p className="text-2xl font-extrabold text-white">-0.84</p>
                <p className="text-[11px] text-slate-300">&quot;Checkout flow is slow&quot;</p>
              </div>
            </div>
          </motion.div>

          {/* ── STAGE 3: THEME CLUSTERING (Scroll 50–75%) ──────────────── */}
          <motion.div
            style={{ opacity: stage3Opacity }}
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-24 z-20 px-6"
          >
            <div className="text-center space-y-1 mt-6">
              <Badge variant="purple" size="sm">
                STAGE 02 — THEME CLUSTER DISCOVERY
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mb-12">
              <div className="p-4 rounded-xl bg-purple-950/90 border border-purple-500/50 space-y-1 text-center shadow-2xl backdrop-blur-md">
                <span className="text-xs font-bold text-purple-300 block font-mono">Theme: Checkout Latency</span>
                <span className="text-[11px] text-slate-300">42 signals clustered (88% vector similarity)</span>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/90 border border-indigo-500/50 space-y-1 text-center shadow-2xl backdrop-blur-md">
                <span className="text-xs font-bold text-indigo-300 block font-mono">Theme: SSO &amp; Auth Setup</span>
                <span className="text-[11px] text-slate-300">38 signals clustered (92% vector similarity)</span>
              </div>

              <div className="p-4 rounded-xl bg-sky-950/90 border border-sky-500/50 space-y-1 text-center shadow-2xl backdrop-blur-md">
                <span className="text-xs font-bold text-sky-300 block font-mono">Theme: Mobile UX &amp; Dark Mode</span>
                <span className="text-[11px] text-slate-300">19 signals clustered (84% vector similarity)</span>
              </div>
            </div>
          </motion.div>

          {/* ── STAGE 4: ACTIONABLE DECISION (Scroll 75–100%) ──────────── */}
          <motion.div
            style={{ opacity: stage4Opacity }}
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-24 z-20 px-6"
          >
            <div className="text-center space-y-1 mt-6">
              <Badge variant="success" size="sm">
                STAGE 03 — ACTIONABLE DECISION
              </Badge>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/95 border border-emerald-500/50 shadow-2xl max-w-lg w-full space-y-3 text-left backdrop-blur-md mb-12">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-mono text-emerald-400 font-bold">HIGH PRIORITY ROADMAP ITEM</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">STATUS: ACTIONED</span>
              </div>

              <h4 className="text-base font-bold text-white">
                Optimize Safari Checkout Payment Gateway Pipeline
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Prioritized engineering action item generated automatically from 42 clustered negative checkout signals.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
