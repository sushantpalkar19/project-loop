"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Layers,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  ChevronRight,
} from "lucide-react";
import { AtmosphericBackground } from "@/components/landing/AtmosphericBackground";
import { CinematicHeroSequence } from "@/components/landing/CinematicHeroSequence";
import { PinnedCinematicStory } from "@/components/landing/PinnedCinematicStory";
import { HowItWorksInteractive } from "@/components/landing/HowItWorksInteractive";
import { FeaturesInteractive } from "@/components/landing/FeaturesInteractive";
import { ProductPreviewInteractive } from "@/components/landing/ProductPreviewInteractive";

export default function Home() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    // Direct Ref mutation on mousemove — ZERO React component tree re-renders!
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.x = (e.clientX / innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden relative">
      {/* Volumetric Atmospheric Glow & Spatial Lighting */}
      <AtmosphericBackground mouseRef={mouseRef} />

      {/* ── HEADER NAVBAR ────────────────────────────────────────── */}
      <header className="border-b border-slate-800/60 bg-[#05070d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-xl block leading-none">
                PROJECT LOOP
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block mt-0.5">
                AI Customer Feedback Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#cinematic-story" className="hover:text-white transition-colors">
              Story Journey
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Intelligence Features
            </a>
            <a href="#preview" className="hover:text-white transition-colors">
              Product Preview
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1. CINEMATIC HERO (STAGGERED TIMED REVEAL) ────────────── */}
      <CinematicHeroSequence mouseRef={mouseRef} isReducedMotion={isReducedMotion} />

      {/* ── 2. TRUSTED PLATFORM CAPABILITY STRIP ──────────────────── */}
      <section className="py-6 border-y border-slate-800/80 bg-slate-950/60 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Multi-Tenant Workspace Isolation</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL & Vector Embeddings</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Bulk CSV Feedback Processing</span>
          </div>
        </div>
      </section>

      {/* ── 3. PINNED CINEMATIC SCROLL STORYTELLER ────────────────── */}
      <section id="cinematic-story" className="relative z-10">
        <PinnedCinematicStory mouseRef={mouseRef} isReducedMotion={isReducedMotion} />
      </section>

      {/* ── 4. [ HOW LOOP WORKS ] (Collect → Understand → Act) ────── */}
      <section id="how-it-works" className="py-16 sm:py-20 px-6 relative z-10 bg-slate-950/90 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block">
              Workflow Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How PROJECT LOOP Works
            </h2>
            <p className="text-sm text-slate-400">
              A 3-stage visual intelligence pipeline transforming unstructured noise into prioritized decisions.
            </p>
          </div>

          <HowItWorksInteractive />
        </div>
      </section>

      {/* ── 5. [ INTELLIGENCE FEATURES ] ─────────────────────────── */}
      <section id="features" className="py-16 sm:py-20 px-6 bg-slate-900/40 relative z-10 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              AI Intelligence Features
            </h2>
            <p className="text-sm text-slate-400">
              Real-time analytics and conversational insight generation built for enterprise product teams.
            </p>
          </div>

          <FeaturesInteractive />
        </div>
      </section>

      {/* ── 6. [ PRODUCT PREVIEW ] ────────────────────────────────── */}
      <section id="preview" className="py-16 sm:py-20 px-6 relative z-10 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 block">
              Product Workspace View
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Floating 3D Product Interface
            </h2>
            <p className="text-sm text-slate-400">
              Interactive high-velocity feedback triage, status workflows, and sentiment breakdown.
            </p>
          </div>

          <ProductPreviewInteractive mouseRef={mouseRef} />
        </div>
      </section>

      {/* ── 7. FINAL CTA BANNER ───────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 bg-gradient-to-b from-indigo-950/90 to-slate-950 border border-indigo-500/40 p-10 sm:p-14 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to transform customer feedback?
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Get started in seconds with isolated workspace provisioning and automated feedback intelligence.
          </p>
          <div className="pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 px-8 py-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95"
            >
              <span>Create Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. FOOTER ─────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-xs text-slate-500 bg-[#05070d] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">PROJECT LOOP</span>
            <span>— AI Customer-Feedback Intelligence</span>
          </div>
          <p>© {new Date().getFullYear()} Project LOOP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
