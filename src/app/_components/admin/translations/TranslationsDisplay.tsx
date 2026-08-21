"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  TranslationCatalog,
  TranslationCatalogEntry,
} from "@/domain/translation/operations/getTranslationCatalog";
import { pruneOrphanedTranslationsAction } from "@/domain/translation/actions";
import TranslationRow from "./TranslationRow";

interface Props {
  initialCatalog: TranslationCatalog;
}

export default function TranslationsDisplay({ initialCatalog }: Props) {
  const t = useTranslations("admin.translations");
  const [entries, setEntries] = useState(initialCatalog.entries);
  const [orphans, setOrphans] = useState(initialCatalog.orphans);
  const [search, setSearch] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [onlyEdited, setOnlyEdited] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isPruning, setIsPruning] = useState(false);

  const handleEntryChange = (updated: TranslationCatalogEntry) => {
    setEntries(prev => prev.map(e => (e.key === updated.key ? updated : e)));
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter(entry => {
      if (onlyIncomplete && entry.en.complete && entry.sl.complete)
        return false;
      if (
        onlyEdited &&
        entry.en.override === null &&
        entry.sl.override === null
      )
        return false;
      if (!query) return true;
      return (
        entry.key.toLowerCase().includes(query) ||
        (entry.en.override ?? entry.en.fileValue ?? "")
          .toLowerCase()
          .includes(query) ||
        (entry.sl.override ?? entry.sl.fileValue ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [entries, search, onlyIncomplete, onlyEdited]);

  // Group by top-level namespace, preserving key order
  const groups = useMemo(() => {
    const map = new Map<string, TranslationCatalogEntry[]>();
    for (const entry of filtered) {
      const namespace = entry.key.split(".")[0];
      const list = map.get(namespace);
      if (list) list.push(entry);
      else map.set(namespace, [entry]);
    }
    return [...map.entries()];
  }, [filtered]);

  const isFiltering = search.trim() !== "" || onlyIncomplete || onlyEdited;

  const toggleGroup = (namespace: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(namespace)) next.delete(namespace);
      else next.add(namespace);
      return next;
    });
  };

  const incompleteCount = entries.filter(
    e => !e.en.complete || !e.sl.complete
  ).length;
  const editedCount = entries.filter(
    e => e.en.override !== null || e.sl.override !== null
  ).length;

  const handlePrune = async () => {
    setIsPruning(true);
    try {
      await pruneOrphanedTranslationsAction();
      setOrphans([]);
    } finally {
      setIsPruning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats + downloads */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
          <div>
            {t("stats.keys")}:{" "}
            <strong className="text-gray-900">{entries.length}</strong>
          </div>
          <div>
            {t("stats.incomplete")}:{" "}
            <strong className="text-amber-600">{incompleteCount}</strong>
          </div>
          <div>
            {t("stats.edited")}:{" "}
            <strong className="text-blue-600">{editedCount}</strong>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              window.location.href =
                "/api/v1/admin/translations/download?locale=en";
            }}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            {t("downloadEn")}
          </button>
          <button
            onClick={() => {
              window.location.href =
                "/api/v1/admin/translations/download?locale=sl";
            }}
            className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
          >
            {t("downloadSl")}
          </button>
        </div>
      </div>

      {/* Orphans */}
      {orphans.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="text-sm text-amber-800">
            {t("orphansNotice", { count: orphans.length })}
            <span className="block text-xs text-amber-700 mt-1 font-mono">
              {orphans
                .slice(0, 5)
                .map(o => `${o.locale}:${o.key}`)
                .join(", ")}
              {orphans.length > 5 && ` +${orphans.length - 5}`}
            </span>
          </div>
          <button
            onClick={handlePrune}
            disabled={isPruning}
            className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md whitespace-nowrap disabled:opacity-50"
          >
            {isPruning ? t("pruning") : t("pruneOrphans")}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 min-w-[220px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyIncomplete}
            onChange={e => setOnlyIncomplete(e.target.checked)}
            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
          />
          {t("filterIncomplete")}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyEdited}
            onChange={e => setOnlyEdited(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          {t("filterEdited")}
        </label>
      </div>

      {/* Namespace tree */}
      <div className="space-y-3">
        {groups.map(([namespace, groupEntries]) => {
          const isOpen = isFiltering || expanded.has(namespace);
          const groupIncomplete = groupEntries.filter(
            e => !e.en.complete || !e.sl.complete
          ).length;
          const groupEdited = groupEntries.filter(
            e => e.en.override !== null || e.sl.override !== null
          ).length;

          return (
            <div
              key={namespace}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <button
                onClick={() => toggleGroup(namespace)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span className="font-mono font-semibold text-gray-900">
                    {namespace}
                  </span>
                  <span className="text-xs text-gray-400">
                    {t("groupCount", { count: groupEntries.length })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {groupEdited > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {groupEdited} {t("editedBadge").toLowerCase()}
                    </span>
                  )}
                  {groupIncomplete > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {t("groupIncomplete", { count: groupIncomplete })}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      ✓
                    </span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t">
                  {groupEntries.map(entry => (
                    <TranslationRow
                      key={entry.key}
                      entry={entry}
                      onEntryChange={handleEntryChange}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {t("emptyFiltered")}
          </div>
        )}
      </div>
    </div>
  );
}
