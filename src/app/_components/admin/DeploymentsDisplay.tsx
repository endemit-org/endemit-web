"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import {
  listDeploymentsAction,
  type ListDeploymentsResult,
} from "@/domain/deploy/actions/listDeploymentsAction";
import type { VercelDeployment } from "@/domain/deploy/operations/getVercelDeployments";
import ClientDate from "@/app/_components/ui/ClientDate";

const stateColors: Record<string, string> = {
  READY: "bg-green-100 text-green-800",
  BUILDING: "bg-yellow-100 text-yellow-800",
  INITIALIZING: "bg-yellow-100 text-yellow-800",
  QUEUED: "bg-gray-100 text-gray-800",
  ERROR: "bg-red-100 text-red-800",
  CANCELED: "bg-gray-100 text-gray-500",
};

const ACTIVE_STATES = ["QUEUED", "INITIALIZING", "BUILDING"];
const ACTIVE_POLL_MS = 15_000;

function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function DeploymentsDisplay() {
  const t = useTranslations("admin.deploy.list");
  const [result, setResult] = useState<ListDeploymentsResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const next = await listDeploymentsAction();
      setResult(next);
    } catch {
      setResult(prev => ({
        configured: prev?.configured ?? true,
        deployments: prev?.deployments ?? [],
        branch: prev?.branch ?? null,
        error: "failed",
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep polling while a build is in flight so the state badge flips to
  // READY/ERROR without manual refreshes.
  useEffect(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    const hasActive = result?.deployments.some(d =>
      ACTIVE_STATES.includes(d.state)
    );
    if (hasActive) {
      pollTimer.current = setTimeout(load, ACTIVE_POLL_MS);
    }
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [result, load]);

  if (result && !result.configured) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t("title")}
        </h2>
        <p className="text-sm text-gray-500">{t("notConfigured")}</p>
      </div>
    );
  }

  const deployments = result?.deployments ?? [];

  return (
    <div className="bg-white rounded-lg shadow mt-6">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500">
            {result?.branch
              ? t("subtitleBranch", { branch: result.branch })
              : t("subtitle")}
          </p>
        </div>
        <button
          onClick={load}
          disabled={isRefreshing}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
        >
          {isRefreshing ? t("refreshing") : t("refresh")}
        </button>
      </div>

      {result?.error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {t("loadError")}
        </div>
      )}

      {!result && (
        <p className="px-6 pb-6 text-sm text-gray-500">{t("loading")}</p>
      )}

      {result && deployments.length === 0 && !result.error && (
        <p className="px-6 pb-6 text-sm text-gray-500">{t("empty")}</p>
      )}

      {deployments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  t("col.status"),
                  t("col.environment"),
                  t("col.branch"),
                  t("col.commit"),
                  t("col.creator"),
                  t("col.age"),
                  t("col.duration"),
                  t("col.links"),
                ].map(header => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deployments.map((d: VercelDeployment) => (
                <tr key={d.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={clsx(
                        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                        stateColors[d.state] || "bg-gray-100 text-gray-800"
                      )}
                    >
                      {d.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {d.target === "production" ? (
                      <span className="font-medium text-gray-900">
                        {t("production")}
                      </span>
                    ) : (
                      <span className="text-gray-500">{t("preview")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                    {d.branch ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate"
                    title={d.commitMessage ?? undefined}
                  >
                    {d.commitMessage ?? "—"}
                    {d.commitSha && (
                      <span className="ml-2 font-mono text-xs text-gray-400">
                        {d.commitSha.slice(0, 7)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {d.creator ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <ClientDate date={d.createdAt} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {d.durationMs != null ? formatDuration(d.durationMs) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-3">
                    {d.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {t("visit")}
                      </a>
                    )}
                    {d.inspectorUrl && (
                      <a
                        href={d.inspectorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {t("inspect")}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
