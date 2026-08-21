import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { TranslationLocale } from "@/domain/translation/operations/getTranslationCatalog";

export interface SetTranslationCompleteInput {
  locale: TranslationLocale;
  key: string;
  complete: boolean;
  userId: string;
}

export async function setTranslationComplete({
  locale,
  key,
  complete,
  userId,
}: SetTranslationCompleteInput): Promise<void> {
  const existing = await prisma.translationEntry.findUnique({
    where: { locale_key: { locale, key } },
  });

  if (!existing) {
    if (!complete) return;
    await prisma.translationEntry.create({
      data: { locale, key, complete: true, updatedById: userId },
    });
    return;
  }

  // Un-marking a flag-only row removes it entirely
  if (!complete && existing.value === null) {
    await prisma.translationEntry.delete({ where: { id: existing.id } });
    return;
  }

  await prisma.translationEntry.update({
    where: { id: existing.id },
    data: { complete, updatedById: userId },
  });
}
