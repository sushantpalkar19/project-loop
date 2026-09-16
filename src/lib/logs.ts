/**
 * Project LOOP — Admin Activity Logs
 *
 * Server-side utility for creating and querying admin activity logs.
 * Logs are workspace-scoped and admin-only.
 */

import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// ── Types ─────────────────────────────────────

export interface CreateLogInput {
  workspaceId: string;
  action: string;
  message: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface LogEntry {
  id: string;
  action: string;
  message: string;
  userId: string | null;
  userName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ── Log Creation ──────────────────────────────

/**
 * Create an activity log entry.
 * Timestamp is generated server-side via @default(now()).
 */
export async function createLog(input: CreateLogInput): Promise<void> {
  try {
    await db.log.create({
      data: {
        workspaceId: input.workspaceId,
        action: input.action,
        message: input.message,
        userId: input.userId ?? null,
        userName: input.userName ?? null,
        metadata: input.metadata ? (input.metadata as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    // Log creation should never break the calling operation
    console.error("Failed to create activity log:", error);
  }
}

// ── Log Querying ──────────────────────────────

export interface FetchLogsOptions {
  workspaceId: string;
  page?: number;
  pageSize?: number;
  action?: string;
}

export interface FetchLogsResult {
  logs: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetch paginated logs for a workspace.
 */
export async function fetchLogs(
  options: FetchLogsOptions
): Promise<FetchLogsResult> {
  const { workspaceId, page = 1, pageSize = 20, action } = options;

  const where: Record<string, unknown> = { workspaceId };
  if (action) {
    where.action = action;
  }

  const [logs, total] = await Promise.all([
    db.log.findMany({
      where,
      select: {
        id: true,
        action: true,
        message: true,
        userId: true,
        userName: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.log.count({ where }),
  ]);

  return {
    logs: logs.map((l) => ({
      ...l,
      metadata: l.metadata as Record<string, unknown> | null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
