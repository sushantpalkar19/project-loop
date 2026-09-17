"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  Loader2, Sparkles, Send, AlertCircle, Database,
  ArrowRight, ShieldCheck, PackageSearch, RefreshCw,
} from "lucide-react";

interface Source {
  id: string;
  summary: string;
  sentiment: string;
  similarity: number;
  themes?: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  hasEvidence?: boolean;
  timestamp: Date;
}

// Error codes returned by /api/ask that require distinct UI treatment
type AskErrorCode =
  | "NO_FEEDBACK_FOUND"        // workspace genuinely has no feedback records
  | "FEEDBACK_NOT_INDEXED"     // feedback exists but embeddings are missing
  | "GEMINI_FAILED"            // AI generation failure
  | "EMBEDDING_FAILED"         // vector search failure
  | "MISSING_API_KEY"          // GEMINI_API_KEY not configured
  | "GEMINI_QUOTA_EXHAUSTED"   // rate limit hit
  | "OTHER";                   // generic server error

function classifyErrorCode(errorCode?: string): AskErrorCode {
  if (!errorCode) return "OTHER";
  if (errorCode === "NO_FEEDBACK_FOUND") {
    return "NO_FEEDBACK_FOUND";
  }
  if (errorCode === "FEEDBACK_NOT_INDEXED") return "FEEDBACK_NOT_INDEXED";
  if (errorCode === "EMBEDDING_FAILED") return "EMBEDDING_FAILED";
  if (errorCode === "GEMINI_FAILED") return "GEMINI_FAILED";
  if (errorCode === "MISSING_API_KEY") return "MISSING_API_KEY";
  if (errorCode === "GEMINI_QUOTA_EXHAUSTED") return "GEMINI_QUOTA_EXHAUSTED";
  return "OTHER";
}

interface AskError {
  message: string;
  errorCode: AskErrorCode;
  /** True when feedback records exist but embeddings are missing */
  isIndexingPending: boolean;
}

export default function AskLoop() {
  const { error: toastError, info } = useToast();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [askError, setAskError] = useState<AskError | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** API minimum is 5 chars — keep in sync with /api/ask schema */
  const MIN_QUESTION_LENGTH = 5;

  const suggestedQuestions = [
    "What are our biggest customer complaints?",
    "What do customers like most about our product?",
    "What issues are increasing this week?",
    "Summarize negative feedback regarding setup and onboarding.",
    "What are users saying about pricing?",
  ];

  const handleSubmit = async (queryOverride?: string) => {
    const targetQuery = queryOverride || question;
    const trimmed = targetQuery.trim();

    if (trimmed.length < MIN_QUESTION_LENGTH || trimmed.length > 500) {
      const msg = `Question must be between ${MIN_QUESTION_LENGTH} and 500 characters`;
      setAskError({ message: msg, errorCode: "OTHER", isIndexingPending: false });
      toastError(msg, "Invalid Question");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setAskError(null);
    info("Querying workspace customer feedback vectors...", "Ask LOOP AI");

    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await response.json() as {
        answer?: string;
        sources?: Source[];
        hasEvidence?: boolean;
        error?: string;
        errorCode?: string;
      };

      if (!response.ok) {
        // Detect whether feedback exists but embeddings are missing.
        const isIndexingPending = Boolean(
          data.errorCode === "FEEDBACK_NOT_INDEXED" ||
          (data.errorCode === "NO_FEEDBACK_FOUND" && data.error?.includes("not been indexed"))
        );

        const errorCode = classifyErrorCode(data.errorCode);
        const message = data.error || "Failed to get answer from Ask LOOP";

        setAskError({ message, errorCode, isIndexingPending });

        // Only toast actual server failures, not data-state messages
        if (errorCode !== "NO_FEEDBACK_FOUND" && errorCode !== "FEEDBACK_NOT_INDEXED") {
          toastError(message, "Ask LOOP Error");
        }

        // Restore user question so they can retry
        setMessages((prev) => prev.slice(0, -1));
        setQuestion(trimmed);
        return;
      }

      if (!data.answer) {
        throw new Error("Received an empty answer from Ask LOOP");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        hasEvidence: data.hasEvidence ?? true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setAskError({ message, errorCode: "OTHER", isIndexingPending: false });
      toastError(message, "Ask LOOP Error");
      setMessages((prev) => prev.slice(0, -1));
      setQuestion(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestedQuestion = (suggestion: string) => {
    setQuestion(suggestion);
    handleSubmit(suggestion);
  };

  const isEmpty = messages.length === 0;

  // ── Error banner helpers ───────────────────────
  /** Whether the current error is a data-state (no feedback / not indexed) vs a real failure */
  const isDataStateError =
    askError?.errorCode === "NO_FEEDBACK_FOUND" ||
    askError?.errorCode === "FEEDBACK_NOT_INDEXED";
  /** Whether the user's question should be retried (not for data-state errors) */
  const isRetryableError = askError && !isDataStateError;


  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                AI FEEDBACK INTELLIGENCE ASSISTANT
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Ask LOOP
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Ask questions about your customer feedback and receive evidence-backed AI answers grounded in real workspace customer data.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Workspace Isolation Active</span>
          </div>
        </div>
      </div>

      {/* ── Data-State Banner: No Feedback / Not Indexed ── */}
      {askError && isDataStateError && (
        <Card className={`border ${
          askError.isIndexingPending
            ? "border-amber-200 bg-amber-50/80"
            : "border-slate-200 bg-slate-50/80"
        }`}>
          <CardContent className="p-5 flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 ${
              askError.isIndexingPending ? "text-amber-500" : "text-slate-400"
            }`}>
              <PackageSearch className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className={`text-xs font-bold ${
                askError.isIndexingPending ? "text-amber-900" : "text-slate-800"
              }`}>
                {askError.isIndexingPending
                  ? "Feedback exists but indexing is pending"
                  : "No customer feedback in this workspace"}
              </p>
              <p className={`text-xs ${
                askError.isIndexingPending ? "text-amber-700" : "text-slate-600"
              }`}>
                {askError.message}
              </p>
              {askError.isIndexingPending && (
                <p className="text-[11px] text-amber-600 font-semibold mt-1">
                  Ask your workspace admin to trigger reindexing, or try again in a few minutes.
                </p>
              )}
              {!askError.isIndexingPending && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Use the Feedback Inbox to import feedback via CSV or create individual records.
                </p>
              )}
            </div>
            <button
              onClick={() => setAskError(null)}
              className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 text-xs font-bold"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Error Banner: Real Server / AI Errors ── */}
      {askError && isRetryableError && (
        <Card className="border-rose-200 bg-rose-50/80">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs text-rose-900 font-bold">
                  {askError.errorCode === "GEMINI_QUOTA_EXHAUSTED"
                    ? "AI rate limit reached"
                    : askError.errorCode === "MISSING_API_KEY"
                    ? "AI not configured"
                    : "Ask LOOP encountered an error"}
                </p>
                <p className="text-xs text-rose-800">{askError.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Retry button for retryable errors */}
              {question.trim().length >= MIN_QUESTION_LENGTH && (
                <button
                  onClick={() => handleSubmit()}
                  className="flex items-center gap-1 text-xs text-rose-700 hover:text-rose-950 font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
              <button
                onClick={() => setAskError(null)}
                className="text-rose-700 hover:text-rose-950 font-bold underline text-xs"
              >
                Dismiss
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Welcome: Suggested Questions Grid (shown when no messages and no blocking error) ── */}
      {isEmpty && !askError && (
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-100 shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Query Customer Feedback Intelligence
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 max-w-md mx-auto">
              Click a suggested question below or type your own custom feedback question.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestedQuestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestedQuestion(suggestion)}
                  className="group text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-xs font-semibold text-slate-800 hover:text-indigo-950 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <span>&ldquo;{suggestion}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages Feed */}
      <div className="space-y-6">
        {messages.map((message, index) => (
          <div key={index} className="space-y-3">
            {/* User Message */}
            {message.role === "user" && (
              <div className="flex justify-end">
                <div className="max-w-2xl">
                  <div className="bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-md">
                    <p className="text-xs sm:text-sm font-semibold leading-relaxed">{message.content}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-right font-mono">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {/* Assistant Response */}
            {message.role === "assistant" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 space-y-4">
                    {/* Answer Card */}
                    <div className="bg-white border border-slate-200/90 p-5 rounded-2xl rounded-tl-xs shadow-2xs space-y-3">
                      <div className="prose prose-slate prose-sm max-w-none text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {/* Evidence Citation Header */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Database className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-slate-800">
                            Based on {message.sources?.length ?? 0} feedback items
                          </span>
                        </div>
                        {message.hasEvidence === false && (
                          <Badge variant="warning" size="sm" className="font-bold">
                            Limited evidence in DB
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Grounded Evidence Sources Cards */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-1">
                          Supporting Customer Feedback Evidence:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {message.sources.map((source) => (
                            <div
                              key={source.id}
                              onClick={() => setSelectedSource(source)}
                              className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                            >
                              <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed font-medium">
                                {source.summary}
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <Badge
                                  variant={
                                    source.sentiment === "POS"
                                      ? "pos"
                                      : source.sentiment === "NEG"
                                      ? "neg"
                                      : "neu"
                                  }
                                  size="sm"
                                  className="font-bold"
                                >
                                  {source.sentiment}
                                </Badge>
                                <span className="text-[10px] text-indigo-600 font-bold group-hover:underline">
                                  Inspect Evidence
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
            <span className="text-xs text-slate-600 font-semibold">
              Analyzing workspace customer feedback and querying vector index...
            </span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <Card className="sticky bottom-4 shadow-lg border-slate-300/80">
        <CardContent className="p-4 space-y-2">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about customer feedback (e.g. What are customers saying about onboarding?)..."
              disabled={isLoading}
              className="flex-1 min-h-[50px] max-h-[160px] p-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
              rows={1}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={isLoading || question.trim().length < MIN_QUESTION_LENGTH}
              isLoading={isLoading}
              variant="primary"
              size="md"
              className="h-[50px] px-5 shrink-0 font-bold"
              leftIcon={!isLoading && <Send className="w-4 h-4" />}
            >
              Ask
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Press Enter to send</span>
            <span className="font-mono">{question.trim().length}/500</span>
          </div>
        </CardContent>
      </Card>

      {/* Source Evidence Detail Modal */}
      {selectedSource && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedSource(null)}
          title="Customer Feedback Evidence Detail"
          subtitle={`Match Score: ${Math.round((selectedSource.similarity || 1) * 100)}%`}
          maxWidth="md"
        >
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Recorded Feedback Text
              </span>
              <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-medium">
                {selectedSource.summary}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedSource.sentiment === "POS"
                    ? "pos"
                    : selectedSource.sentiment === "NEG"
                    ? "neg"
                    : "neu"
                }
                size="sm"
                className="font-bold"
              >
                Sentiment: {selectedSource.sentiment}
              </Badge>
              {selectedSource.themes?.map((t) => (
                <Badge key={t} variant="purple" size="sm" className="font-bold">
                  {t}
                </Badge>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button onClick={() => setSelectedSource(null)} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
