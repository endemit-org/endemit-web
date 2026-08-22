"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchPosRegisterReportAction } from "@/domain/pos/actions/fetchPosRegisterReportAction";
import type { PosRegisterReport } from "@/domain/pos/operations/getPosRegisterReport";
import { formatTokensFromCents } from "@/lib/util/currency";

interface Props {
  registerId: string;
  registerName: string;
  onClose: () => void;
}

type SortKey = "quantity" | "total";

export default function PosRegisterReportModal({
  registerId,
  registerName,
  onClose,
}: Props) {
  const t = useTranslations("admin.pos.registers.report");
  const [report, setReport] = useState<PosRegisterReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("quantity");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPosRegisterReportAction(registerId)
      .then(result => {
        if (!cancelled) setReport(result);
      })
      .catch(err => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [registerId]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(prev => !prev);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const sortedItems = report
    ? [...report.items].sort((a, b) =>
        sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
      )
    : [];

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDesc ? " ▼" : " ▲") : "";

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t("title", { name: registerName })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
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

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!report && !error && (
            <p className="text-center text-gray-500 py-8">{t("loading")}</p>
          )}

          {report && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat
                  label={t("statOrders")}
                  value={report.paidOrdersCount.toLocaleString()}
                />
                <Stat
                  label={t("statItemsSold")}
                  value={report.totalItemsSold.toLocaleString()}
                />
                <Stat
                  label={t("statRevenue")}
                  value={formatTokensFromCents(report.salesRevenue)}
                />
                <Stat
                  label={t("statTips")}
                  value={formatTokensFromCents(report.tipsCollected)}
                />
                <Stat
                  label={t("statGross")}
                  value={formatTokensFromCents(report.grossTotal)}
                />
                <Stat
                  label={t("statTopUps")}
                  value={formatTokensFromCents(report.topUpsProcessed)}
                />
                <Stat
                  label={t("statLowestOrder")}
                  value={formatTokensFromCents(report.lowestOrderTotal)}
                />
                <Stat
                  label={t("statHighestOrder")}
                  value={formatTokensFromCents(report.highestOrderTotal)}
                />
                <Stat
                  label={t("statAvgOrder")}
                  value={formatTokensFromCents(report.averageOrderTotal)}
                />
                <Stat
                  label={t("statHighestTip")}
                  value={formatTokensFromCents(report.highestTip)}
                />
              </div>

              {report.byMethod.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    {t("byMethodHeading")}
                  </h3>
                  <div className="border rounded-lg divide-y text-sm">
                    {report.byMethod.map(row => (
                      <div
                        key={row.method}
                        className="px-4 py-2 flex items-center justify-between"
                      >
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            row.method === "WALLET"
                              ? "bg-blue-100 text-blue-700"
                              : row.method === "CASH"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {t(`method${row.method}`)}
                        </span>
                        <span className="text-gray-500">
                          {t("methodOrders", { count: row.orders })}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatTokensFromCents(row.revenue)}
                          {row.tips > 0 && (
                            <span className="text-amber-600 ml-1 text-xs">
                              +{formatTokensFromCents(row.tips)}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {t("itemsHeading")}
                </h3>
                {report.items.length === 0 ? (
                  <p className="text-sm text-gray-500">{t("noItems")}</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("colItem")}
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort("quantity")}
                            className="uppercase tracking-wider hover:text-gray-700"
                          >
                            {t("colQuantity")}
                            {sortIndicator("quantity")}
                          </button>
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort("total")}
                            className="uppercase tracking-wider hover:text-gray-700"
                          >
                            {t("colTotal")}
                            {sortIndicator("total")}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedItems.map(item => (
                        <tr key={item.itemId}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.name}
                            {item.direction === "CREDIT" && (
                              <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {t("topUpBadge")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">
                            {item.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                            {formatTokensFromCents(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
