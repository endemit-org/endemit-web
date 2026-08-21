import "server-only";

import { prisma } from "@/lib/services/prisma";
import enMessages from "../../../../../messages/en.json";
import slMessages from "../../../../../messages/sl.json";
import { flattenMessages, type MessageTree } from "@/domain/translation/util";

export type TranslationLocale = "en" | "sl";

export interface TranslationLocaleState {
  fileValue: string | null;
  override: string | null;
  complete: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface TranslationCatalogEntry {
  key: string;
  en: TranslationLocaleState;
  sl: TranslationLocaleState;
}

export interface OrphanedTranslation {
  locale: TranslationLocale;
  key: string;
  value: string | null;
}

export interface TranslationCatalog {
  entries: TranslationCatalogEntry[];
  orphans: OrphanedTranslation[];
  totalCount: number;
  incompleteCount: number;
  editedCount: number;
}

const emptyState = (): TranslationLocaleState => ({
  fileValue: null,
  override: null,
  complete: false,
  updatedBy: null,
  updatedAt: null,
});

export async function getTranslationCatalog(): Promise<TranslationCatalog> {
  const enFlat = flattenMessages(enMessages as MessageTree);
  const slFlat = flattenMessages(slMessages as MessageTree);

  const rows = await prisma.translationEntry.findMany({
    include: {
      updatedBy: { select: { name: true, email: true } },
    },
  });

  // Auto-reconcile: an override that now matches the deployed file value has
  // been committed — drop the override (keep the complete flag).
  const appliedIds: string[] = [];
  const deletableIds: string[] = [];
  for (const row of rows) {
    if (row.value === null) continue;
    const fileValue =
      row.locale === "en" ? enFlat.get(row.key) : slFlat.get(row.key);
    if (fileValue !== undefined && fileValue === row.value) {
      if (row.complete) {
        appliedIds.push(row.id);
      } else {
        deletableIds.push(row.id);
      }
      row.value = null;
    }
  }
  if (appliedIds.length > 0) {
    await prisma.translationEntry.updateMany({
      where: { id: { in: appliedIds } },
      data: { value: null },
    });
  }
  if (deletableIds.length > 0) {
    await prisma.translationEntry.deleteMany({
      where: { id: { in: deletableIds } },
    });
  }

  // Key universe: union of both files, in en-file order with sl-only keys after.
  const keys: string[] = [...enFlat.keys()];
  const enKeySet = new Set(keys);
  for (const key of slFlat.keys()) {
    if (!enKeySet.has(key)) keys.push(key);
  }
  const keySet = new Set(keys);

  const rowMap = new Map<string, (typeof rows)[number]>();
  const orphans: OrphanedTranslation[] = [];
  for (const row of rows) {
    if (keySet.has(row.key) && (row.locale === "en" || row.locale === "sl")) {
      rowMap.set(`${row.locale}:${row.key}`, row);
    } else {
      orphans.push({
        locale: row.locale as TranslationLocale,
        key: row.key,
        value: row.value,
      });
    }
  }

  const toState = (
    locale: TranslationLocale,
    key: string,
    fileValue: string | undefined
  ): TranslationLocaleState => {
    const row = rowMap.get(`${locale}:${key}`);
    if (!row) return { ...emptyState(), fileValue: fileValue ?? null };
    return {
      fileValue: fileValue ?? null,
      override: row.value,
      complete: row.complete,
      updatedBy: row.updatedBy?.name || row.updatedBy?.email || null,
      updatedAt: row.updatedAt.toISOString(),
    };
  };

  const entries: TranslationCatalogEntry[] = keys.map(key => ({
    key,
    en: toState("en", key, enFlat.get(key)),
    sl: toState("sl", key, slFlat.get(key)),
  }));

  const incompleteCount = entries.filter(
    e => !e.en.complete || !e.sl.complete
  ).length;
  const editedCount = entries.filter(
    e => e.en.override !== null || e.sl.override !== null
  ).length;

  return {
    entries,
    orphans,
    totalCount: entries.length,
    incompleteCount,
    editedCount,
  };
}
