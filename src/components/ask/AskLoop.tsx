"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Send, AlertCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────

interface Source {
  id: string;
  summary: string;
  sentiment: string;
  similarity: number;
  themes?: string[];
}

interface ChatResponse {
  answer: string;
  sources: Source[];
  hasEvidence: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  hasEvidence?: boolean;
  timestamp: Date;
}

// ── Component ───────────────────────────────

export default function AskLoop() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedQuestions = [
    "What are customers most unhappy about?",
    "What are the biggest positive themes?",
    "Why are customers mentioning pricing?",
    "What should we prioritize?",
  ];

  // ── Handlers ───────────────────────────────

  const handleSubmit = async () => {
    const trimmed = question.trim();

    if (trimmed.length < 5 || trimmed.length > 500) {
      setError("Question must be between 5 and 500 characters");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get answer");
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        hasEvidence: data.hasEvidence,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      
      // Remove the user message if the request failed
      setMessages((prev) => prev.slice(0, -1));
      
      // Restore the question
      setQuestion(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestedQuestion = (suggestion: string) => {
    setQuestion(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // ── Render ─────────────────────────────────

  const isEmpty = messages.length === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ask LOOP</h1>
        </div>
        <p className="text-slate-600">
          Ask questions about your customer feedback and get AI-powered insights based on real data.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-900">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800 text-sm"
            >
              Dismiss
            </button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {isEmpty && (
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                  Welcome to Ask LOOP
                </h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  I can help you analyze your customer feedback. Ask me anything about themes, sentiment, or patterns in your data.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 text-center">
                Try asking:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedQuestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestedQuestion(suggestion)}
                    className="text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-sm text-slate-700 hover:text-indigo-900"
                  >
                    &ldquo;{suggestion}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="space-y-3">
            {/* User Message */}
            {message.role === "user" && (
              <div className="flex justify-end">
                <div className="max-w-2xl">
                  <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm">
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {/* Assistant Message */}
            {message.role === "assistant" && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-slate-900 whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {!message.hasEvidence && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-amber-700 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Limited evidence found in feedback
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-slate-700">
                            Based on customer feedback
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {message.sources.map((source) => (
                            <div
                              key={source.id}
                              className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2"
                            >
                              <p className="text-sm text-slate-700 line-clamp-2">
                                {source.summary}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant={
                                    source.sentiment === "POS"
                                      ? "pos"
                                      : source.sentiment === "NEG"
                                      ? "neg"
                                      : "neu"
                                  }
                                  size="sm"
                                >
                                  {source.sentiment}
                                </Badge>
                                {source.themes &&
                                  source.themes.slice(0, 2).map((theme) => (
                                    <Badge key={theme} variant="neutral" size="sm">
                                      {theme}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                <p className="text-sm text-slate-500">Thinking...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <Card className="sticky bottom-0">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your customer feedback..."
              disabled={isLoading}
              className="flex-1 min-h-[60px] max-h-[200px] px-4 py-3 rounded-lg border border-slate-300 resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || question.trim().length < 5}
              isLoading={isLoading}
              leftIcon={!isLoading && <Send className="w-4 h-4" />}
              className="h-[60px] px-4"
            >
              Send
            </Button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-400">
              Press Ctrl/Cmd + Enter to send
            </p>
            <p className="text-xs text-slate-400">
              {question.trim().length}/500
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
