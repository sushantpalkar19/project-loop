import { db } from "../src/lib/db";
import { canonicalizeThemeName } from "../src/lib/ai/integration";

async function mergeDuplicates() {
  console.log("==========================================");
  console.log("PROJECT LOOP — SAFE THEME MERGE AUDIT");
  console.log("==========================================\n");

  const workspaces = await db.workspace.findMany();

  for (const ws of workspaces) {
    console.log(`Auditing workspace: "${ws.name}" (${ws.id})...`);

    const themes = await db.theme.findMany({
      where: { workspaceId: ws.id },
      include: { _count: { select: { feedbacks: true } } },
    });

    const canonicalGroups = new Map<string, typeof themes>();

    for (const t of themes) {
      const canonical = canonicalizeThemeName(t.name);
      const list = canonicalGroups.get(canonical) || [];
      list.push(t);
      canonicalGroups.set(canonical, list);
    }

    for (const [canonicalName, group] of Array.from(canonicalGroups.entries())) {
      if (group.length <= 1) continue;

      console.log(`\n  Found duplicate cluster for "${canonicalName}":`);
      group.forEach((t) =>
        console.log(
          `   - Theme ID ${t.id}: "${t.name}" (${t._count.feedbacks} feedback(s))`
        )
      );

      const primaryTheme =
        group.find((t) => t.name === canonicalName) ||
        group.reduce((prev, curr) =>
          curr._count.feedbacks > prev._count.feedbacks ? curr : prev
        );

      const secondaryThemes = group.filter((t) => t.id !== primaryTheme.id);

      console.log(
        `   Primary target: "${primaryTheme.name}" (${primaryTheme.id})`
      );

      if (primaryTheme.name !== canonicalName) {
        await db.theme.update({
          where: { id: primaryTheme.id },
          data: { name: canonicalName },
        });
      }

      for (const sec of secondaryThemes) {
        console.log(
          `   Migrating secondary theme "${sec.name}" (${sec.id}) -> "${primaryTheme.name}"...`
        );

        const secLinks = await db.feedbackTheme.findMany({
          where: { themeId: sec.id },
        });

        for (const link of secLinks) {
          await db.feedbackTheme.upsert({
            where: {
              feedbackId_themeId: {
                feedbackId: link.feedbackId,
                themeId: primaryTheme.id,
              },
            },
            update: {
              confidence: link.confidence,
            },
            create: {
              feedbackId: link.feedbackId,
              themeId: primaryTheme.id,
              confidence: link.confidence,
            },
          });

          await db.feedbackTheme.delete({
            where: {
              feedbackId_themeId: {
                feedbackId: link.feedbackId,
                themeId: sec.id,
              },
            },
          });
        }

        await db.theme.delete({
          where: { id: sec.id },
        });
        console.log(`   ✓ Deleted redundant theme "${sec.name}" (${sec.id})`);
      }
    }
  }

  console.log("\n==========================================");
  console.log("THEME MERGE COMPLETE");
  console.log("==========================================");
}

mergeDuplicates()
  .catch((e) => console.error("Merge error:", e))
  .finally(async () => await db.$disconnect());
