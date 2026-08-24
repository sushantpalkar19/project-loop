/**
 * Project LOOP — Development Seed
 *
 * Creates:
 *   • 1 demo workspace
 *   • 3 demo users (ADMIN, ANALYST, VIEWER)
 *   • 8 realistic themes
 *   • 20 sample feedback records (expandable to 120+)
 *
 * Run: npx prisma db seed
 * Requires: DATABASE_URL pointing to an accessible PostgreSQL instance
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { Role, Sentiment, FeedbackStatus } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// ── Helper: random element from array ─────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Seed Data ─────────────────────────────────

const WORKSPACE_ID = "demo-workspace-001";
const WORKSPACE_NAME = "LOOP Demo Workspace";

const USERS = [
  {
    id: "demo-user-admin-001",
    name: "Sarah Chen",
    email: "admin@loop.demo",
    role: Role.ADMIN,
  },
  {
    id: "demo-user-analyst-001",
    name: "Marcus Johnson",
    email: "analyst@loop.demo",
    role: Role.ANALYST,
  },
  {
    id: "demo-user-viewer-001",
    name: "Emily Park",
    email: "viewer@loop.demo",
    role: Role.VIEWER,
  },
];

const DEMO_PASSWORD = "demo-password-change-in-production";

const THEMES = [
  { name: "Product Quality", description: "Feedback about product quality and reliability", color: "#3B82F6" },
  { name: "Customer Support", description: "Feedback about support experience and responsiveness", color: "#10B981" },
  { name: "Pricing", description: "Feedback about pricing, billing, and value perception", color: "#F59E0B" },
  { name: "User Experience", description: "Feedback about UI/UX, navigation, and design", color: "#8B5CF6" },
  { name: "Performance", description: "Feedback about speed, reliability, and uptime", color: "#EF4444" },
  { name: "Feature Requests", description: "Suggestions for new features and improvements", color: "#06B6D4" },
  { name: "Onboarding", description: "Feedback about setup experience and first impressions", color: "#EC4899" },
  { name: "Mobile Experience", description: "Feedback specific to mobile app or responsive design", color: "#84CC16" },
];

const CHANNELS = ["email", "survey", "social", "api", "manual", "chat"];

const FEEDBACK_SAMPLES = [
  // Positive feedback
  { content: "The new dashboard redesign is fantastic! Everything I need is right at my fingertips.", sentiment: Sentiment.POS, sentimentScore: 0.9 },
  { content: "Customer support resolved my issue in under 10 minutes. Truly impressed!", sentiment: Sentiment.POS, sentimentScore: 0.95 },
  { content: "Love the recent performance improvements. Page loads are noticeably faster.", sentiment: Sentiment.POS, sentimentScore: 0.85 },
  { content: "The onboarding tutorial made it incredibly easy to get started. Great job!", sentiment: Sentiment.POS, sentimentScore: 0.9 },
  { content: "Excellent value for money. The features included in the basic plan exceeded my expectations.", sentiment: Sentiment.POS, sentimentScore: 0.8 },
  { content: "The mobile app is smooth and responsive. Works just as well as the desktop version.", sentiment: Sentiment.POS, sentimentScore: 0.85 },
  { content: "API documentation is clear and well-organized. Integration was straightforward.", sentiment: Sentiment.POS, sentimentScore: 0.8 },
  { content: "Really appreciate the regular updates and new features. The team clearly listens to feedback.", sentiment: Sentiment.POS, sentimentScore: 0.9 },
  { content: "The search functionality is lightning fast now. Great improvement over the previous version.", sentiment: Sentiment.POS, sentimentScore: 0.85 },
  { content: "Batch export feature saved me hours of work. This is exactly what I needed.", sentiment: Sentiment.POS, sentimentScore: 0.9 },

  // Neutral feedback
  { content: "The product works as described. Nothing exceptional but gets the job done.", sentiment: Sentiment.NEU, sentimentScore: 0.1 },
  { content: "Setup was standard. Took about 30 minutes which seems reasonable.", sentiment: Sentiment.NEU, sentimentScore: 0.0 },
  { content: "The interface is functional. Could use some design polish but it's usable.", sentiment: Sentiment.NEU, sentimentScore: 0.05 },
  { content: "Pricing is competitive with other solutions in the market. Fairly standard.", sentiment: Sentiment.NEU, sentimentScore: 0.0 },
  { content: "The reporting features are adequate for basic needs. Advanced users might want more.", sentiment: Sentiment.NEU, sentimentScore: 0.1 },
  { content: "Email notifications work fine. Sometimes I get too many but that's configurable.", sentiment: Sentiment.NEU, sentimentScore: 0.05 },
  { content: "The API has all the endpoints I need. Documentation could be more detailed though.", sentiment: Sentiment.NEU, sentimentScore: 0.1 },
  { content: "Integration with our existing tools was straightforward. No major issues.", sentiment: Sentiment.NEU, sentimentScore: 0.15 },

  // Negative feedback
  { content: "The search function returns irrelevant results about 50% of the time. Frustrating.", sentiment: Sentiment.NEG, sentimentScore: -0.7 },
  { content: "Had to wait 3 days for customer support response. Unacceptable for a paid service.", sentiment: Sentiment.NEG, sentimentScore: -0.8 },
  { content: "The mobile app crashes frequently when loading large datasets.", sentiment: Sentiment.NEG, sentimentScore: -0.9 },
  { content: "Pricing increased 40% without notice. Feels like a bait-and-switch.", sentiment: Sentiment.NEG, sentimentScore: -0.85 },
  { content: "The new UI update broke my workflow. Features I used daily are now hidden.", sentiment: Sentiment.NEG, sentimentScore: -0.6 },
  { content: "Export to CSV produces malformed files. Had to manually fix 200+ rows.", sentiment: Sentiment.NEG, sentimentScore: -0.7 },
  { content: "The dashboard is painfully slow with more than 1000 records. Needs optimization.", sentiment: Sentiment.NEG, sentimentScore: -0.75 },
  { content: "Two-factor authentication setup is confusing. Lost access to my account twice.", sentiment: Sentiment.NEG, sentimentScore: -0.8 },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Create Workspace ─────────────────────

  const workspace = await prisma.workspace.upsert({
    where: { id: WORKSPACE_ID },
    update: {},
    create: {
      id: WORKSPACE_ID,
      name: WORKSPACE_NAME,
    },
  });
  console.log(`  ✓ Workspace: ${workspace.name}`);

  // ── 2. Create Users with workspaceId + role ─

  const passwordHash = hashPassword(DEMO_PASSWORD);

  const createdUsers = [];
  for (const userData of USERS) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role,
        workspaceId: workspace.id,
      },
    });
    createdUsers.push(user);
  }
  console.log(`  ✓ Users: ${createdUsers.map((u) => `${u.name} (${u.role})`).join(", ")}`);

  // ── 3. Create Themes ───────────────────────

  const createdThemes = [];
  for (const themeData of THEMES) {
    const theme = await prisma.theme.upsert({
      where: {
        workspaceId_name: {
          workspaceId: workspace.id,
          name: themeData.name,
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        ...themeData,
      },
    });
    createdThemes.push(theme);
  }
  console.log(`  ✓ Themes: ${createdThemes.map((t) => t.name).join(", ")}`);

  // ── 4. Create Feedback Records ─────────────

  const feedbackRecords = [];
  const customerLabels = [
    "CUST-001", "CUST-002", "CUST-003", "CUST-004", "CUST-005",
    "CUST-006", "CUST-007", "CUST-008", "CUST-009", "CUST-010",
  ];
  const sourceRefs = [
    "TKT-1001", "TKT-1002", "TKT-1003", "TKT-1004", "TKT-1005",
    "TWEET-2001", "TWEET-2002", "TWEET-2003", "SURVEY-3001", "SURVEY-3002",
  ];

  const statuses = [
    FeedbackStatus.NEW,
    FeedbackStatus.REVIEWED,
    FeedbackStatus.ACTIONED,
  ];

  for (let i = 0; i < FEEDBACK_SAMPLES.length; i++) {
    const sample = FEEDBACK_SAMPLES[i];
    const feedback = await prisma.feedback.create({
      data: {
        workspaceId: workspace.id,
        content: sample.content,
        channel: pick(CHANNELS),
        sourceRef: sourceRefs[i % sourceRefs.length],
        customerLabel: customerLabels[i % customerLabels.length],
        sentiment: sample.sentiment,
        sentimentScore: sample.sentimentScore,
        status: pick(statuses),
      },
    });
    feedbackRecords.push(feedback);
  }
  console.log(`  ✓ Feedback: ${feedbackRecords.length} records created`);

  // ── 5. Link Feedback to Themes ─────────────

  let linkCount = 0;
  for (const feedback of feedbackRecords) {
    // Assign 1-2 random themes per feedback with varying confidence
    const numThemes = Math.random() > 0.5 ? 2 : 1;
    const assignedThemes = new Set<string>();

    for (let t = 0; t < numThemes; t++) {
      let theme = pick(createdThemes);
      // Avoid duplicate theme assignments
      while (assignedThemes.has(theme.id)) {
        theme = pick(createdThemes);
      }
      assignedThemes.add(theme.id);

      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
          confidence: Math.round((0.6 + Math.random() * 0.4) * 100) / 100, // 0.60 to 1.00
        },
      });
      linkCount++;
    }
  }
  console.log(`  ✓ FeedbackTheme links: ${linkCount} created`);

  console.log("\n🎉 Seed complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
