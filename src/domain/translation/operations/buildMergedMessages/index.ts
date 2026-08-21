import "server-only";

import { prisma } from "@/lib/services/prisma";
import enMessages from "../../../../../messages/en.json";
import slMessages from "../../../../../messages/sl.json";
import {
  setMessageAtPath,
  type MessageTree,
} from "@/domain/translation/util";
import type { TranslationLocale } from "@/domain/translation/operations/getTranslationCatalog";

/**
 * The deployed message file with all stored overrides applied — a drop-in
 * replacement for messages/<locale>.json. Key order is preserved because
 * overrides only replace existing leaves in the cloned file tree.
 */
export async function buildMergedMessages(
  locale: TranslationLocale
): Promise<MessageTree> {
  const source = (locale === "en" ? enMessages : slMessages) as MessageTree;
  const merged = structuredClone(source);

  const overrides = await prisma.translationEntry.findMany({
    where: { locale, value: { not: null } },
    select: { key: true, value: true },
  });

  for (const override of overrides) {
    if (override.value !== null) {
      setMessageAtPath(merged, override.key, override.value);
    }
  }

  return merged;
}
