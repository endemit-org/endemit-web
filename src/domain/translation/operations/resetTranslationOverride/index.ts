import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { TranslationLocale } from "@/domain/translation/operations/getTranslationCatalog";

export async function resetTranslationOverride(
  locale: TranslationLocale,
  key: string
): Promise<void> {
  const existing = await prisma.translationEntry.findUnique({
    where: { locale_key: { locale, key } },
  });
  if (!existing) return;

  if (existing.complete) {
    await prisma.translationEntry.update({
      where: { id: existing.id },
      data: { value: null },
    });
  } else {
    await prisma.translationEntry.delete({ where: { id: existing.id } });
  }
}
