/**
 * POST /api/feedback/simulate
 *
 * Generates realistic simulated feedback records to mimic third-party
 * channel ingestion (e.g. Zendesk, App Store, Twitter).
 *
 * This is a demo/development feature — not a real integration.
 * Requires ADMIN or ANALYST role.
 * workspaceId from authenticated session only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { FEEDBACK_CHANNELS } from "@/lib/constants";

// ── Realistic Feedback Templates ──────────────

const POSITIVE_FEEDBACK = [
  "The new dashboard redesign is exactly what we needed. Everything is intuitive and fast.",
  "Customer support resolved my issue in under 10 minutes. Truly impressed with the response time.",
  "Love the recent performance improvements. Page loads are noticeably faster than before.",
  "The onboarding tutorial made it incredibly easy to get started. Great first impression.",
  "Excellent value for money. The features included in the basic plan exceeded my expectations.",
  "The mobile app is smooth and responsive. Works just as well as the desktop version.",
  "API documentation is clear and well-organized. Integration with our stack was straightforward.",
  "Really appreciate the regular updates and new features. The team clearly listens to feedback.",
  "The search functionality is lightning fast now. Great improvement over the previous version.",
  "Batch export feature saved me hours of work. This is exactly what I needed for reporting.",
  "The real-time collaboration tools have transformed how our team works together.",
  "Setup was seamless — we were up and running in under an hour with zero friction.",
  "The analytics dashboard gives me exactly the insights I need without overwhelming complexity.",
  "Integration with Slack works flawlessly. Our whole team gets notified automatically now.",
  "The custom branding options let us make the platform feel truly ours.",
];

const NEUTRAL_FEEDBACK = [
  "The product works as described. Nothing exceptional but gets the job done.",
  "Setup was standard. Took about 30 minutes which seems reasonable for this type of tool.",
  "The interface is functional. Could use some design polish but it's perfectly usable.",
  "Pricing is competitive with other solutions in the market. Fairly standard offering.",
  "The reporting features are adequate for basic needs. Advanced users might want more depth.",
  "Email notifications work fine. Sometimes I get too many but that's configurable.",
  "The API has all the endpoints I need. Documentation could be more detailed in some areas.",
  "Integration with our existing tools was straightforward. No major issues encountered.",
  "The file storage limits are reasonable for our team size. Would be nice to have more though.",
  "Onboarding was okay. Some steps felt redundant but we got through it.",
];

const NEGATIVE_FEEDBACK = [
  "The search function returns irrelevant results about half the time. Very frustrating experience.",
  "Had to wait three days for customer support response. Unacceptable for a paid service tier.",
  "The mobile app crashes frequently when loading large datasets over cellular connections.",
  "Pricing increased significantly without prior notice. Feels like a bait-and-switch tactic.",
  "The new UI update broke my daily workflow. Features I used regularly are now buried in menus.",
  "Export to CSV produces malformed files. Had to manually fix over two hundred rows of data.",
  "The dashboard is painfully slow with more than a thousand records. Needs serious optimization.",
  "Two-factor authentication setup is confusing. Lost access to my account twice this month.",
  "The notification system is unreliable. I miss critical alerts because emails arrive late.",
  "API rate limits are too restrictive for our usage pattern. We hit limits during normal operations.",
];

const CUSTOMER_LABELS = [
  "CUST-1001", "CUST-1002", "CUST-1003", "CUST-1004", "CUST-1005",
  "CUST-2001", "CUST-2002", "CUST-2003", "CUST-3001", "CUST-3002",
  "ACME Corp", "TechStart Inc", "GlobalRetail Ltd", "DataFlow Systems", "CloudNine SAAS",
  "Vertex Analytics", "BrightPath Co", "Meridian Tech", "Summit Labs", "Pinnacle Digital",
];

const SOURCE_REF_PREFIXES = ["TKT", "TWEET", "APP", "SURVEY", "CHAT", "EMAIL", "ZEN"];

// ── Generator ─────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSourceRef(): string {
  const prefix = pick(SOURCE_REF_PREFIXES);
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

function generateRandomDate(): Date {
  // Random date within the last 90 days
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const offset = Math.floor(Math.random() * ninetyDaysMs);
  return new Date(now - offset);
}

function generateBatch(count: number) {
  const records: Array<{
    workspaceId: string;
    content: string;
    channel: string;
    sourceRef: string;
    customerLabel: string;
    sentiment: "POS" | "NEU" | "NEG";
    sentimentScore: number;
    status: "NEW";
    createdAt: Date;
  }> = [];

  const channels = [...FEEDBACK_CHANNELS];

  for (let i = 0; i < count; i++) {
    // Weighted sentiment distribution: 40% positive, 35% neutral, 25% negative
    const roll = Math.random();
    let content: string;
    let sentiment: "POS" | "NEU" | "NEG";
    let sentimentScore: number;

    if (roll < 0.4) {
      content = pick(POSITIVE_FEEDBACK);
      sentiment = "POS";
      sentimentScore = Math.round((0.5 + Math.random() * 0.5) * 100) / 100;
    } else if (roll < 0.75) {
      content = pick(NEUTRAL_FEEDBACK);
      sentiment = "NEU";
      sentimentScore = Math.round((Math.random() * 0.4 - 0.2) * 100) / 100;
    } else {
      content = pick(NEGATIVE_FEEDBACK);
      sentiment = "NEG";
      sentimentScore = Math.round((-0.5 - Math.random() * 0.5) * 100) / 100;
    }

    records.push({
      workspaceId: "", // set by caller
      content,
      channel: pick(channels),
      sourceRef: generateSourceRef(),
      customerLabel: pick(CUSTOMER_LABELS),
      sentiment,
      sentimentScore,
      status: "NEW",
      createdAt: generateRandomDate(),
    });
  }

  return records;
}

// ── POST Handler ──────────────────────────────

const BATCH_SIZE = 10;

export async function POST(_request: NextRequest) {
  try {
    // 1. Authenticate + require ADMIN or ANALYST
    const user = await requireRole(["ADMIN", "ANALYST"]);

    // 2. Generate realistic feedback records
    const records = generateBatch(BATCH_SIZE);

    // 3. Set workspaceId from authenticated session
    const data = records.map((r) => ({
      ...r,
      workspaceId: user.workspaceId,
    }));

    // 4. Bulk insert
    const result = await db.feedback.createMany({ data });

    // 5. Return success
    return NextResponse.json({
      message: `Simulated ${result.count} feedback records from multiple channels`,
      count: result.count,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      const authErr = error as unknown as { code: string; message: string };
      const status = authErr.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: authErr.message }, { status });
    }

    console.error("Simulate ingestion error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during simulation" },
      { status: 500 }
    );
  }
}
