"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import UserAutocomplete from "./UserAutocomplete";
import type { UserSearchResult } from "@/domain/user/actions/searchUsersAction";

interface ClaimRow {
  id: string;
  eventId: string;
  eventName: string;
  status: "PENDING" | "APPROVED";
  createdAt: string;
  approvedAt: string | null;
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
  };
}

interface PastEvent {
  id: string;
  name: string;
  dateStart: string | null;
}

interface InitialData {
  items: ClaimRow[];
  total: number;
  page: number;
  pageSize: number;
  filter: "all" | "PENDING" | "APPROVED";
  search: string;
}

interface Props {
  initial: InitialData;
  pastEvents: PastEvent[];
}

export default function EventClaimsDisplay({ initial, pastEvents }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.eventClaims");
  const tc = useTranslations("admin.common");
  const currentSearchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initial.search);
  const [busyClaimId, setBusyClaimId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
    (filter: "all" | "PENDING" | "APPROVED") => {
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

  const handleApprove = useCallback(
    async (claim: ClaimRow) => {
      if (
        !confirm(
          t("approveConfirm", {
            event: claim.eventName,
            user: claim.user.username,
          })
        )
      )
        return;
      setBusyClaimId(claim.id);
      setError(null);
      try {
        const response = await fetch(
          `/api/v1/admin/event-claims/${claim.id}/approve`,
          { method: "POST" }
        );
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t("failedApprove"));
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedApprove"));
      } finally {
        setBusyClaimId(null);
      }
    },
    [router, t]
  );

  const handleDelete = useCallback(
    async (claim: ClaimRow) => {
      if (
        !confirm(
          t("deleteConfirm", {
            status: claim.status,
            event: claim.eventName,
            user: claim.user.username,
          })
        )
      )
        return;
      setBusyClaimId(claim.id);
      setError(null);
      try {
        const response = await fetch(`/api/v1/admin/event-claims/${claim.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t("failedDelete"));
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("failedDelete"));
      } finally {
        setBusyClaimId(null);
      }
    },
    [router, t]
  );

  const totalPages = Math.max(1, Math.ceil(initial.total / initial.pageSize));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-2">
          {(["all", "PENDING", "APPROVED"] as const).map(f => (
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
              {f === "all"
                ? t("filterAll")
                : f === "PENDING"
                  ? t("pending")
                  : t("approved")}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <form onSubmit={onSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm text-white bg-gray-700 hover:bg-gray-800 rounded-md"
            >
              {tc("search")}
            </button>
          </form>
          <button
            onClick={() => {
              setError(null);
              setIsCreateOpen(true);
            }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            + {t("addClaim")}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colUser")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colEvent")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colStatus")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colCreated")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("colActions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {initial.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  {t("noClaims")}
                </td>
              </tr>
            ) : (
              initial.items.map(claim => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <Link
                      href={`/admin/users/${claim.user.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {claim.user.name || claim.user.username}
                    </Link>
                    {claim.user.email && (
                      <div className="text-xs text-gray-500">
                        {claim.user.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {claim.eventName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        claim.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      )}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(claim.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {claim.status === "PENDING" && (
                      <button
                        onClick={() => handleApprove(claim)}
                        disabled={busyClaimId === claim.id}
                        className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                      >
                        {t("approveNow")}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(claim)}
                      disabled={busyClaimId === claim.id}
                      className="px-2 py-1 text-xs text-red-600 border border-red-300 hover:border-red-500 rounded disabled:opacity-50"
                    >
                      {tc("delete")}
                    </button>
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
            {t("pageInfo", {
              page: initial.page,
              totalPages,
              total: initial.total,
            })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                updateParam({ page: String(Math.max(1, initial.page - 1)) })
              }
              disabled={initial.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {t("previous")}
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
              {t("next")}
            </button>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <CreateClaimModal
          pastEvents={pastEvents}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CreateClaimModal({
  pastEvents,
  onClose,
  onCreated,
}: {
  pastEvents: PastEvent[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations("admin.eventClaims");
  const tc = useTranslations("admin.common");
  const [userQuery, setUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = pastEvents.find(e => e.id === selectedEventId);

  const handleSubmit = useCallback(async () => {
    if (!selectedUser || !selectedEvent) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/admin/event-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("failedCreate"));
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedCreate"));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUser, selectedEvent, onCreated, t]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            {t("addClaim")}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("colUser")}
            </label>
            <UserAutocomplete
              value={userQuery}
              onChange={value => {
                setUserQuery(value);
                if (!value) setSelectedUser(null);
              }}
              onUserSelect={user => setSelectedUser(user)}
              disabled={isSubmitting}
              placeholder={t("userSearchPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("colEvent")}
            </label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">{t("selectEvent")}</option>
              {pastEvents.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                  {event.dateStart
                    ? ` (${new Date(event.dateStart).toLocaleDateString()})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500">{t("autoApproveNote")}</p>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedUser || !selectedEventId}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {isSubmitting ? t("creating") : t("createClaim")}
          </button>
        </div>
      </div>
    </div>
  );
}
