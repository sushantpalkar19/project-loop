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
import { createLog } from "@/lib/logs";

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
    const user = await requireRole(["ADMIN", "MANAGER", "ANALYST", "VIEWER"]);
    console.log(`[Ask LOOP] POST /api/ask — userId=${user.id.substring(0, 8)}..., workspaceId=${user.workspaceId.substring(0, 8)}...`);

    const body = await request.json();
    const result = askRequestSchema.safeParse(body);

    if (!result.success) {
      console.warn(`[Ask LOOP] Validation failed:`, result.error.flatten().fieldErrors);
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const response = await askLoop(result.data.question, user.workspaceId);

    // Log the Ask LOOP query
    createLog({
      workspaceId: user.workspaceId,
      action: "ask.query",
      message: `Asked LOOP: "${result.data.question.substring(0, 50)}${result.data.question.length > 50 ? '...' : ''}"`,
      userId: user.id,
      userName: user.name || user.email,
      metadata: { questionLength: result.data.question.length, hasEvidence: response.hasEvidence },
    });

    console.log(`[Ask LOOP] Success — hasEvidence=${response.hasEvidence}, sources=${response.sources.length}`);

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
        // Return structured error — do NOT return a fake "answer" body here.
        // The client uses response.ok (404 = not ok) to route to error display.
        // Include errorCode so AskLoop.tsx can show context-specific guidance.
        return NextResponse.json(
          {
            error: chatErr.message,
            errorCode: "NO_FEEDBACK_FOUND",
          },
          { status: 404 }
        );
      }

      if (chatErr.code === "INSUFFICIENT_EVIDENCE") {
        // Still a successful response — answer is returned but flagged low-confidence
        return NextResponse.json(
          { error: chatErr.message, errorCode: "INSUFFICIENT_EVIDENCE" },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: chatErr.message, errorCode: chatErr.code },
        { status }
      );
    }

    console.error("[Ask LOOP] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
