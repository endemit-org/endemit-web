"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { createTranslator } from "next-intl";
import {
  saveTranslationOverrideAction,
  setTranslationCompleteAction,
  resetTranslationOverrideAction,
} from "@/domain/translation/actions";
import type { TranslationCatalogEntry } from "@/domain/translation/operations/getTranslationCatalog";
import {
  extractIcuArguments,
  extractTags,
} from "@/domain/translation/util";
import ClientDate from "@/app/_components/ui/ClientDate";

type Locale = "en" | "sl";

interface Props {
  entry: TranslationCatalogEntry;
  onEntryChange: (entry: TranslationCatalogEntry) => void;
}

const TAG_ELEMENTS: Record<string, (chunks: ReactNode) => ReactNode> = {
  strong: chunks => <strong>{chunks}</strong>,
  b: chunks => <strong>{chunks}</strong>,
  em: chunks => <em>{chunks}</em>,
  i: chunks => <em>{chunks}</em>,
};

function renderPreview(
  locale: Locale,
  message: string,
  values: Record<string, string | number>
): { ok: true; node: ReactNode } | { ok: false; error: string } {
  // createTranslator reports parse/format problems via onError (returning a
  // fallback string) rather than throwing — capture them to block saving.
  let captured: string | null = null;
  try {
    const t = createTranslator({
      locale,
      messages: { __preview: message },
      onError: err => {
        captured = err.message;
      },
    });
    const tags = extractTags(message);
    let node: ReactNode;
    if (tags.length > 0) {
      const tagHandlers: Record<string, (chunks: ReactNode) => ReactNode> = {};
      for (const tag of tags) {
        tagHandlers[tag] =
          TAG_ELEMENTS[tag] ??
          (chunks => <span className="font-semibold">{chunks}</span>);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      node = t.rich("__preview" as any, { ...values, ...tagHandlers } as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      node = t("__preview" as any, values as any);
    }
    if (captured) return { ok: false, error: captured };
    return { ok: true, node };
  } catch (err) {
    return {
      ok: false,
      error:
        captured ?? (err instanceof Error ? err.message : "Invalid message"),
    };
  }
}

function LocaleEditor({
  locale,
  entry,
  onEntryChange,
  sampleValues,
}: {
  locale: Locale;
  entry: TranslationCatalogEntry;
  onEntryChange: (entry: TranslationCatalogEntry) => void;
  sampleValues: Record<string, string | number>;
}) {
  const t = useTranslations("admin.translations");
  const state = entry[locale];
  const otherState = entry[locale === "en" ? "sl" : "en"];
  const currentValue = state.override ?? state.fileValue ?? "";
  const [draft, setDraft] = useState(currentValue);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = draft !== currentValue;
  const isMissing = state.fileValue === null && state.override === null;

  const preview = useMemo(
    () => renderPreview(locale, draft, sampleValues),
    [locale, draft, sampleValues]
  );

  // Warn (not block) when placeholders/tags from the other language are missing
  const missingParts = useMemo(() => {
    const otherValue = otherState.override ?? otherState.fileValue;
    if (!otherValue || !draft) return [];
    const wanted = [
      ...extractIcuArguments(otherValue).map(a => `{${a.name}}`),
      ...extractTags(otherValue).map(tag => `<${tag}>`),
    ];
    return wanted.filter(part => {
      const name = part.slice(1, -1);
      return part.startsWith("{")
        ? !draft.includes(`{${name}`)
        : !draft.includes(`<${name}>`);
    });
  }, [draft, otherState.override, otherState.fileValue]);

  const handleSave = async () => {
    if (!preview.ok) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveTranslationOverrideAction({
        locale,
        key: entry.key,
        value: draft,
      });
      const becameOverride = draft !== (state.fileValue ?? "");
      onEntryChange({
        ...entry,
        [locale]: {
          ...state,
          override: becameOverride ? draft : null,
        },
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await resetTranslationOverrideAction({ locale, key: entry.key });
      setDraft(state.fileValue ?? "");
      onEntryChange({
        ...entry,
        [locale]: { ...state, override: null },
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    const complete = !state.complete;
    onEntryChange({ ...entry, [locale]: { ...state, complete } });
    try {
      await setTranslationCompleteAction({ locale, key: entry.key, complete });
    } catch {
      onEntryChange({
        ...entry,
        [locale]: { ...state, complete: !complete },
      });
    }
  };

  const hasDynamicParts =
    extractIcuArguments(draft).length > 0 || extractTags(draft).length > 0;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs font-bold uppercase ${
            locale === "en" ? "text-indigo-500" : "text-emerald-600"
          }`}
        >
          {locale}
          {state.override !== null && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-700 normal-case">
              {t("editedBadge")}
            </span>
          )}
          {isMissing && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700 normal-case">
              {t("missingBadge")}
            </span>
          )}
        </span>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={state.complete}
            onChange={handleToggleComplete}
            className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          {t("complete")}
        </label>
      </div>

      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={Math.min(6, Math.max(1, Math.ceil(draft.length / 60)))}
        className={`w-full px-3 py-2 text-sm border rounded-md font-mono focus:ring-blue-500 focus:border-blue-500 ${
          !preview.ok
            ? "border-red-400 bg-red-50"
            : state.override !== null
              ? "border-blue-300 bg-blue-50/50"
              : "border-gray-300"
        }`}
      />

      {!preview.ok && (
        <p className="text-xs text-red-600 mt-1">
          {t("invalidSyntax")}: {preview.error}
        </p>
      )}
      {preview.ok && missingParts.length > 0 && (
        <p className="text-xs text-amber-600 mt-1">
          {t("missingPlaceholders", { parts: missingParts.join(", ") })}
        </p>
      )}
      {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}

      {hasDynamicParts && preview.ok && (
        <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 mr-2">
            {t("previewLabel")}
          </span>
          {preview.node}
        </div>
      )}

      <div className="flex items-center justify-between mt-1 min-h-[22px]">
        <div className="text-[11px] text-gray-400">
          {state.updatedBy && state.updatedAt && (
            <>
              {state.updatedBy} · <ClientDate date={state.updatedAt} />
            </>
          )}
        </div>
        <div className="flex gap-2">
          {state.override !== null && !isDirty && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
            >
              {t("resetToFile")}
            </button>
          )}
          {isDirty && (
            <>
              <button
                onClick={() => setDraft(currentValue)}
                disabled={isSaving}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t("discard")}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !preview.ok}
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded disabled:opacity-50"
              >
                {isSaving ? t("saving") : t("save")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TranslationRow({ entry, onEntryChange }: Props) {
  const t = useTranslations("admin.translations");
  const referenceMessage =
    entry.en.override ?? entry.en.fileValue ?? entry.sl.override ?? entry.sl.fileValue ?? "";
  const args = useMemo(
    () => extractIcuArguments(referenceMessage),
    [referenceMessage]
  );

  const [samples, setSamples] = useState<Record<string, string | number>>({});

  const sampleValues = useMemo(() => {
    const values: Record<string, string | number> = {};
    for (const arg of args) {
      if (arg.type === "plural") {
        values[arg.name] = Number(samples[arg.name] ?? 2);
      } else {
        values[arg.name] = samples[arg.name] ?? arg.name.toUpperCase();
      }
    }
    return values;
  }, [args, samples]);

  const dottedPath = entry.key.split(".");

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
      {/* Key path — namespace segments muted, leaf emphasized */}
      <div className="font-mono text-xs mb-2 select-all">
        {dottedPath.map((segment, i) => (
          <span key={i}>
            {i > 0 && <span className="text-gray-300">.</span>}
            <span
              className={
                i === dottedPath.length - 1
                  ? "text-gray-900 font-bold"
                  : "text-gray-400"
              }
            >
              {segment}
            </span>
          </span>
        ))}
      </div>

      {/* Shared sample inputs driving both previews */}
      {args.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {args.map(arg => (
            <label
              key={arg.name}
              className="flex items-center gap-1.5 text-xs text-gray-500"
            >
              <span className="font-mono">{"{" + arg.name + "}"}</span>
              {arg.type === "plural" ? (
                <input
                  type="number"
                  min={0}
                  value={Number(samples[arg.name] ?? 2)}
                  onChange={e =>
                    setSamples(prev => ({
                      ...prev,
                      [arg.name]: Number(e.target.value),
                    }))
                  }
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                  title={t("pluralSampleHint")}
                />
              ) : (
                <input
                  type="text"
                  value={String(samples[arg.name] ?? arg.name.toUpperCase())}
                  onChange={e =>
                    setSamples(prev => ({
                      ...prev,
                      [arg.name]: e.target.value,
                    }))
                  }
                  className="w-28 px-2 py-1 border border-gray-300 rounded text-xs"
                />
              )}
            </label>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LocaleEditor
          locale="en"
          entry={entry}
          onEntryChange={onEntryChange}
          sampleValues={sampleValues}
        />
        <LocaleEditor
          locale="sl"
          entry={entry}
          onEntryChange={onEntryChange}
          sampleValues={sampleValues}
        />
      </div>
    </div>
  );
}
