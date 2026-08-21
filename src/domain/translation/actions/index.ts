"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  getTranslationCatalog,
  type TranslationCatalog,
  type TranslationLocale,
} from "@/domain/translation/operations/getTranslationCatalog";
import { saveTranslationOverride } from "@/domain/translation/operations/saveTranslationOverride";
import { setTranslationComplete } from "@/domain/translation/operations/setTranslationComplete";
import { resetTranslationOverride } from "@/domain/translation/operations/resetTranslationOverride";
import { pruneOrphanedTranslations } from "@/domain/translation/operations/pruneOrphanedTranslations";

async function requireTranslator() {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.TRANSLATIONS_MANAGE),
    "User not authorized to manage translations"
  );
  return user;
}

export async function fetchTranslationCatalogAction(): Promise<TranslationCatalog> {
  await requireTranslator();
  return await getTranslationCatalog();
}

export async function saveTranslationOverrideAction(input: {
  locale: TranslationLocale;
  key: string;
  value: string;
}): Promise<void> {
  const user = await requireTranslator();
  await saveTranslationOverride({ ...input, userId: user.id });
}

export async function setTranslationCompleteAction(input: {
  locale: TranslationLocale;
  key: string;
  complete: boolean;
}): Promise<void> {
  const user = await requireTranslator();
  await setTranslationComplete({ ...input, userId: user.id });
}

export async function resetTranslationOverrideAction(input: {
  locale: TranslationLocale;
  key: string;
}): Promise<void> {
  await requireTranslator();
  await resetTranslationOverride(input.locale, input.key);
}

export async function pruneOrphanedTranslationsAction(): Promise<number> {
  await requireTranslator();
  return await pruneOrphanedTranslations();
}
