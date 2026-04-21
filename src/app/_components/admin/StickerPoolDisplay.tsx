"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

interface StickerRow {
  code: string;
  userId: string | null;
  claimedAt: string | null;
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
  } | null;
}

interface InitialData {
  items: StickerRow[];
  total: number;
  page: number;
  pageSize: number;
  filter: "all" | "claimed" | "unclaimed";
  search: string;
}

interface Props {
  initial: InitialData;
}

export default function StickerPoolDisplay({ initial }: Props) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initial.search);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState("1000");
  const [generateError, setGenerateError] = useState<string | null>(null);

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(currentSearchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`?${params.toString()}`);
    },
    [currentSearchParams, router]
  );

  const onFilterChange = useCallback(
    (filter: "all" | "claimed" | "unclaimed") => {
      updateParam({ filter: filter === "all" ? null : filter, page: null });
    },
    [updateParam]
  );

  const onSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateParam({ search: searchInput.trim() || null, page: null });
    },
    [searchInput, updateParam]
  );

  const onBulkGenerate = useCallback(async () => {
    const count = Number(generateCount);
    if (!Number.isFinite(count) || count <= 0) {
      setGenerateError("Enter a positive number");
      return;
    }
    if (!confirm(`Generate ${count} new sticker codes?`)) return;

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const response = await fetch("/api/v1/admin/stickers/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }
      alert(`Created ${data.created} new sticker codes (pool: ${data.totalInPool}).`);
      router.refresh();
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Failed to generate"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [generateCount, router]);

  const totalPages = Math.max(1, Math.ceil(initial.total / initial.pageSize));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-2">
          {(["all", "unclaimed", "claimed"] as const).map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={clsx(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                initial.filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {f === "all" ? "All" : f === "unclaimed" ? "Unclaimed" : "Claimed"}
            </button>
          ))}
        </div>

        <form onSubmit={onSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search code, username, email..."
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-sm text-white bg-gray-700 hover:bg-gray-800 rounded-md"
          >
            Search
          </button>
        </form>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 sm:items-center">
        <span className="text-sm font-medium text-gray-700">
          Generate new codes:
        </span>
        <input
          type="number"
          min={1}
          max={5000}
          value={generateCount}
          onChange={e => setGenerateCount(e.target.value)}
          className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-md"
        />
        <button
          onClick={onBulkGenerate}
          disabled={isGenerating}
          className="px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>
        {generateError && (
          <span className="text-sm text-red-600">{generateError}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned to
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claimed at
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {initial.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No stickers match these filters.
                </td>
              </tr>
            ) : (
              initial.items.map(item => (
                <tr key={item.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                    {item.code}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        item.userId
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {item.userId ? "Claimed" : "Unclaimed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.user ? (
                      <div>
                        <div>{item.user.name || item.user.username}</div>
                        {item.user.email && (
                          <div className="text-xs text-gray-500">
                            {item.user.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.claimedAt
                      ? new Date(item.claimedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.userId && (
                      <Link
                        href={`/admin/users/${item.userId}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View user →
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Page {initial.page} of {totalPages} — {initial.total} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                updateParam({ page: String(Math.max(1, initial.page - 1)) })
              }
              disabled={initial.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                updateParam({
                  page: String(Math.min(totalPages, initial.page + 1)),
                })
              }
              disabled={initial.page >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
