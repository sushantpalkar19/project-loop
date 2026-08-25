"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, BrainCircuit, Workflow, ArrowRight, CheckCircle2, Sparkles, Filter, Database } from "lucide-react";

export function HowItWorksInteractive() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 0,
      number: "01",
      title: "COLLECT",
      subtitle: "Multi-Source Customer Ingestion",
      description:
        "Seamlessly aggregate unstructured feedback from Support Emails, NPS Surveys, Social channels, Chat support, and bulk CSV uploads with zero data loss.",
      icon: Inbox,
      color: "from-indigo-500 to-indigo-600",
      accentBorder: "border-indigo-500/40",
      badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
      visualDemo: (
        <div className="space-y-2.5 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">&quot;Checkout page fails on Safari&quot;</span>
            <span className="text-[10px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded">EMAIL</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">&quot;Great analytics dashboard upgrade!&quot;</span>
            <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">SURVEY</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">&quot;Need SSO Google login support&quot;</span>
            <span className="text-[10px] bg-slate-800 text-purple-400 px-2 py-0.5 rounded">CSV IMPORT</span>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      number: "02",
      title: "UNDERSTAND",
      subtitle: "AI Vectors & Sentiment Analytics",
      description:
        "PROJECT LOOP generates vector embeddings, scores sentiment (POS, NEG, NEU), clusters recurring pain points into thematic groups, and computes confidence metrics.",
      icon: BrainCircuit,
      color: "from-purple-500 to-purple-600",
      accentBorder: "border-purple-500/40",
      badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      visualDemo: (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white">Sentiment Calculation</span>
              <span className="font-mono text-emerald-400">POS +0.94</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "94%" }}
                transition={{ duration: 1 }}
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Thematic Cluster</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                Authentication (84% match)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                SSO Integration
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      number: "03",
      title: "ACT",
      subtitle: "Workflow Status & Prioritization",
      description:
        "Drive product decisions. Transition feedback from NEW to REVIEWED to ACTIONED. Connect customer voice directly to roadmap execution.",
      icon: Workflow,
      color: "from-emerald-500 to-emerald-600",
      accentBorder: "border-emerald-500/40",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      visualDemo: (
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Workflow Lifecycle:</span>
            <span className="font-mono text-emerald-400 font-bold">STATUS: ACTIONED</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 p-2 rounded bg-sky-950 border border-sky-800 text-center text-[10px] font-bold text-sky-300">
              NEW
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <div className="flex-1 p-2 rounded bg-amber-950 border border-amber-800 text-center text-[10px] font-bold text-amber-300">
              REVIEWED
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <div className="flex-1 p-2 rounded bg-emerald-950 border border-emerald-800 text-center text-[10px] font-bold text-emerald-300">
              ACTIONED
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left Selector Column */}
      <div className="lg:col-span-5 space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === idx;

          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isActive
                  ? `bg-slate-900/90 ${step.accentBorder} shadow-xl scale-[1.02]`
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${step.color} flex items-center justify-center text-white font-extrabold text-xs shadow-md`}
                  >
                    {step.number}
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    {step.title}
                  </h3>
                </div>

                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${step.badgeColor}`}>
                  {step.subtitle}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pl-11">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Right Animated Visual Display Box */}
      <div className="lg:col-span-7">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative overflow-hidden min-h-[320px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-400 ml-2">
                PROJECT LOOP Stage Demo — {steps[activeStep].title}
              </span>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              Interactive View
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center space-y-4"
            >
              {steps[activeStep].visualDemo}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
