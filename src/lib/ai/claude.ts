/**
 * Project LOOP — Claude AI Client
 *
 * Server-side Anthropic client configuration.
 * This file should NEVER be imported into "use client" components.
 * The API key is read from environment variables and never exposed to clients.
 */

import Anthropic from "@anthropic-ai/sdk";

// ── Model Configuration ───────────────────────

/** Centralized model name — update here when upgrading Claude versions */
export const CLAUDE_MODEL = "claude-sonnet-4-20250514" as const;

/** Default max tokens for classification responses */
export const CLASSIFICATION_MAX_TOKENS = 1024 as const;

// ── Client Singleton ──────────────────────────

let _client: Anthropic | null = null;

/**
 * Get or create the Anthropic client instance.
 * Reads ANTHROPIC_API_KEY from environment variables.
 *
 * @returns Anthropic client
 * @throws Error if ANTHROPIC_API_KEY is not set
 */
export function getAnthropicClient(): Anthropic {
  if (_client) {
    return _client;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. " +
        "Please configure it in .env.local for development or your hosting provider for production."
    );
  }

  _client = new Anthropic({
    apiKey,
  });

  return _client;
}

/**
 * Check if the Claude API is configured and available.
 * Does not make any network calls — only checks environment.
 */
export function isClaudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
