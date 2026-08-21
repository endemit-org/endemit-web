import "server-only";

import { prisma } from "@/lib/services/prisma";
import enMessages from "../../../../../messages/en.json";
import slMessages from "../../../../../messages/sl.json";
import { flattenMessages, type MessageTree } from "@/domain/translation/util";
import type { TranslationLocale } from "@/domain/translation/operations/getTranslationCatalog";

export interface SaveTranslationOverrideInput {
  locale: TranslationLocale;
  key: string;
  value: string;
  userId: string;
}

export async function saveTranslationOverride({
  locale,
  key,
  value,
  userId,
}: SaveTranslationOverrideInput): Promise<void> {
  const flat = flattenMessages(
    (locale === "en" ? enMessages : slMessages) as MessageTree
  );
  const fileValue = flat.get(key);
  const otherFlat = flattenMessages(
    (locale === "en" ? slMessages : enMessages) as MessageTree
  );
  if (fileValue === undefined && otherFlat.get(key) === undefined) {
    throw new Error(`Unknown translation key: ${key}`);
  }

  // Saving the exact file value = no override needed
  const override = value === fileValue ? null : value;

  const existing = await prisma.translationEntry.findUnique({
    where: { locale_key: { locale, key } },
  });

  if (override === null) {
    if (!existing) return;
    if (existing.complete) {
      await prisma.translationEntry.update({
        where: { id: existing.id },
        data: { value: null, updatedById: userId },
      });
    } else {
      await prisma.translationEntry.delete({ where: { id: existing.id } });
    }
    return;
  }

  await prisma.translationEntry.upsert({
    where: { locale_key: { locale, key } },
    create: { locale, key, value: override, updatedById: userId },
    update: { value: override, updatedById: userId },
  });
}
