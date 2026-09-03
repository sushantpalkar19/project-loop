import { db } from "../src/lib/db";
import { classifyAndPersist } from "../src/lib/ai/integration";

async function verify() {
  console.log("==========================================");
  console.log("PROJECT LOOP — THEME END-TO-END VERIFICATION");
  console.log("==========================================\n");

  // 1. Inspect Workspaces
  const workspaces = await db.workspace.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { feedbacks: true, themes: true } },
    },
  });

  console.log(`Found ${workspaces.length} workspace(s):`);
  workspaces.forEach((w) => {
    console.log(
      `- Workspace "${w.name}" (${w.id}): ${w._count.feedbacks} feedback(s), ${w._count.themes} theme(s)`
    );
  });

  if (workspaces.length === 0) {
    console.log("No workspaces found in database.");
    return;
  }

  const targetWorkspace = workspaces.find((w) => w.id === "cmt709b3c00008oghsvk4z5aq") || workspaces[0];
  console.log(
    `\nAuditing Target Workspace: "${targetWorkspace.name}" (${targetWorkspace.id})...\n`
  );

  // 2. Inspect Feedback records
  const feedbackList = await db.feedback.findMany({
    where: { workspaceId: targetWorkspace.id },
    include: { themes: { include: { theme: true } } },
  });

  console.log(`STEP 1: Feedback Records Audit`);
  console.log(`Total feedback records: ${feedbackList.length}`);

  let classifiedCount = 0;
  let unclassifiedCount = 0;
  const unclassifiedItems: typeof feedbackList = [];

  feedbackList.forEach((item) => {
    const hasThemes = item.themes.length > 0;
    if (hasThemes || item.confidence != null) {
      classifiedCount++;
    } else {
      unclassifiedCount++;
      unclassifiedItems.push(item);
    }
  });

  console.log(`- Classified with themes/confidence: ${classifiedCount}`);
  console.log(`- Unclassified: ${unclassifiedCount}`);

  // 3. STEP 2 & 3: Run Gemini classification on unclassified items
  if (unclassifiedItems.length > 0) {
    console.log(
      `\nSTEP 2 & 3: Running Gemini classification on ${unclassifiedItems.length} unclassified feedback item(s)...`
    );

    for (const item of unclassifiedItems.slice(0, 10)) {
      console.log(
        `Classifying feedback [${item.id}]: "${item.content.slice(0, 60)}..."`
      );
      try {
        await classifyAndPersist(item.id, item.content, targetWorkspace.id);
        console.log(`  ✓ Classification succeeded & themes persisted for ${item.id}`);
      } catch (err) {
        console.error(
          `  ✕ Classification failed for ${item.id}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  } else {
    console.log("\nSTEP 2 & 3: All feedback records already classified.");
  }

  // 4. STEP 3 Audit: Check Theme & FeedbackTheme persistence
  const themeRecords = await db.theme.findMany({
    where: { workspaceId: targetWorkspace.id },
    include: { _count: { select: { feedbacks: true } } },
  });

  const feedbackThemeLinks = await db.feedbackTheme.findMany({
    where: { theme: { workspaceId: targetWorkspace.id } },
  });

  console.log(`\nSTEP 3 Persistence Audit:`);
  console.log(`- Total Theme records: ${themeRecords.length}`);
  console.log(`- Total FeedbackTheme associations: ${feedbackThemeLinks.length}`);
  console.log(`- Discovered Theme Names:`);
  themeRecords.forEach((t) => {
    console.log(
      `   • "${t.name}" (${t.color || "no color"}) — ${t._count.feedbacks} feedback(s)`
    );
  });

  // 5. STEP 4 Audit: Analytics Overview aggregation
  console.log(`\nSTEP 4 Analytics API SQL Query Verification:`);
  const rawThemeCounts = await db.$queryRaw<Array<{ themeId: string; count: number }>>`
    SELECT
      ft."themeId",
      COUNT(*)::int AS count
    FROM "FeedbackTheme" ft
    INNER JOIN "Feedback" f ON f.id = ft."feedbackId"
    INNER JOIN "Theme" t ON t.id = ft."themeId"
    WHERE f."workspaceId" = ${targetWorkspace.id}
      AND t."workspaceId" = ${targetWorkspace.id}
    GROUP BY ft."themeId"
    ORDER BY count DESC
    LIMIT 10
  `;

  console.log(`Raw Analytics Theme Query returned ${rawThemeCounts.length} item(s):`);
  for (const row of rawThemeCounts) {
    const themeDetail = themeRecords.find((t) => t.id === row.themeId);
    console.log(
      `   • ${themeDetail?.name || row.themeId}: ${row.count} feedback(s)`
    );
  }

  // 6. Check Multi-Tenant Security
  const otherWorkspaceThemes = await db.theme.findMany({
    where: { workspaceId: { not: targetWorkspace.id } },
  });
  console.log(
    `\nMulti-tenant security check: Other workspace themes count: ${otherWorkspaceThemes.length} (must NOT leak into target query)`
  );

  console.log("\n==========================================");
  console.log("VERIFICATION COMPLETE");
  console.log("==========================================");
}

verify()
  .catch((e) => {
    console.error("Verification script error:", e);
  })
  .finally(async () => {
    await db.$disconnect();
  });
