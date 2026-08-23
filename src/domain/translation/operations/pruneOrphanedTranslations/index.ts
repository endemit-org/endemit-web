import "server-only";

import { prisma } from "@/lib/services/prisma";
import enMessages from "../../../../../messages/en.json";
import slMessages from "../../../../../messages/sl.json";
import { flattenMessages, type MessageTree } from "@/domain/translation/util";

/** Delete DB rows whose key no longer exists in either message file. */
export async function pruneOrphanedTranslations(): Promise<number> {
  const keySet = new Set([
    ...flattenMessages(enMessages as MessageTree).keys(),
    ...flattenMessages(slMessages as MessageTree).keys(),
  ]);

  const rows = await prisma.translationEntry.findMany({
    select: { id: true, key: true, locale: true },
  });
  const orphanIds = rows
    .filter(r => !keySet.has(r.key) || (r.locale !== "en" && r.locale !== "sl"))
    .map(r => r.id);

  if (orphanIds.length === 0) return 0;

  const result = await prisma.translationEntry.deleteMany({
    where: { id: { in: orphanIds } },
  });
  return result.count;
}
