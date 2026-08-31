/**
 * POST /api/ask
 *
 * Ask LOOP API endpoint for RAG-based customer feedback questions.
 * Requires authenticated session.
 * Workspace isolation enforced via session.workspaceId.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { askLoop, isChatError } from "@/lib/ai/chat";
import { z } from "zod";

// ── Validation Schema ───────────────────────

const askRequestSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(500, "Question must be at most 500 characters"),
});

export type AskRequestInput = z.infer<typeof askRequestSchema>;

// ── GET Handler (method not allowed) ────────

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

// ── POST Handler ────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "ANALYST", "VIEWER"]);

    const body = await request.json();
    const result = askRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const response = await askLoop(result.data.question, user.workspaceId);

    return NextResponse.json({
      answer: response.answer,
      sources: response.sources,
      hasEvidence: response.hasEvidence,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    if (isChatError(error)) {
      const chatErr = error;

      const statusMap: Record<string, number> = {
        MISSING_API_KEY: 500,
        INVALID_INPUT: 400,
        NO_FEEDBACK_FOUND: 404,
        EMBEDDING_FAILED: 502,
        GEMINI_FAILED: 502,
        GEMINI_QUOTA_EXHAUSTED: 429,
        GEMINI_AUTH_FAILED: 503,
        GEMINI_UNSUPPORTED_MODEL: 502,
        GEMINI_INVALID_REQUEST: 502,
        INSUFFICIENT_EVIDENCE: 200,
      };

      const status = chatErr.httpStatus ?? statusMap[chatErr.code] ?? 500;

      if (process.env.NODE_ENV === "development" && chatErr.details) {
        console.error(`[Ask LOOP] ${chatErr.code}:`, chatErr.details);
      }

      if (chatErr.code === "NO_FEEDBACK_FOUND") {
        return NextResponse.json(
          {
            error: chatErr.message,
            answer:
              "I don't have any customer feedback to search yet. Add some feedback to your workspace and I'll be able to help you.",
            sources: [],
            hasEvidence: false,
          },
          { status }
        );
      }

      return NextResponse.json({ error: chatErr.message }, { status });
    }

    console.error("[Ask LOOP] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
