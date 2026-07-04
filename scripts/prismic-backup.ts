import "dotenv/config";
import * as prismic from "@prismicio/client";
import { writeFileSync, mkdirSync } from "node:fs";

/**
 * Read-only backup of every Prismic document (all types, all locales) to
 * prismic-backup/<timestamp>/. Run before any content migration:
 *   npx tsx scripts/prismic-backup.ts
 */
async function main() {
  const repo = process.env.PRISMIC_REPOSITORY_NAME!;
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
  const client = prismic.createClient(repo, { accessToken });

  console.log(`Backing up Prismic repo "${repo}"...`);

  // Every document, every language, master ref.
  const docs = await client.dangerouslyGetAll({ lang: "*", pageSize: 100 });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = `prismic-backup/${stamp}`;
  mkdirSync(dir, { recursive: true });

  // One combined file (source of truth for restore) ...
  writeFileSync(`${dir}/all-documents.json`, JSON.stringify(docs, null, 2));

  // ... plus one file per document for easy diffing.
  const byType: Record<string, number> = {};
  for (const doc of docs) {
    byType[doc.type] = (byType[doc.type] ?? 0) + 1;
    const safeUid = doc.uid ?? doc.id;
    writeFileSync(
      `${dir}/${doc.type}--${safeUid}--${doc.id}.json`,
      JSON.stringify(doc, null, 2)
    );
  }

  console.log(`\nBacked up ${docs.length} documents to ${dir}`);
  console.log("By type:", byType);
}

main().catch(err => {
  console.error("Backup failed:", err);
  process.exit(1);
});
