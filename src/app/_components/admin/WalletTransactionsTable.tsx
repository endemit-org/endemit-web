"use client";

import type { SerializedWalletTransaction } from "@/domain/wallet/types";
import { useTranslations } from "next-intl";
import { formatTokensFromCents } from "@/lib/util/currency";
import ClientDate from "@/app/_components/ui/ClientDate";
import clsx from "clsx";

interface WalletTransactionsTableProps {
  transactions: SerializedWalletTransaction[];
}

const typeColors: Record<string, string> = {
  CREDIT: "bg-green-100 text-green-800",
  DEBIT: "bg-red-100 text-red-800",
  PURCHASE: "bg-blue-100 text-blue-800",
  REFUND: "bg-purple-100 text-purple-800",
  ADJUSTMENT: "bg-yellow-100 text-yellow-800",
};

export default function WalletTransactionsTable({
  transactions,
}: WalletTransactionsTableProps) {
  const t = useTranslations("admin.wallets");
  const tt = useTranslations("admin.transactions.type");
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        {t("noTransactions")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("col.date")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("col.type")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("col.amount")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("col.balanceAfter")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("col.note")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("col.createdBy")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <ClientDate date={tx.createdAt} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={clsx(
                    "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                    typeColors[tx.type] || "bg-gray-100 text-gray-800"
                  )}
                >
                  {tt.has(tx.type) ? tt(tx.type) : tx.type}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <span
                  className={clsx(
                    "text-sm font-medium",
                    tx.amount > 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {formatTokensFromCents(tx.amount)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                {formatTokensFromCents(tx.balanceAfter)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                {tx.note || "-"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {tx.createdBy?.name || tx.createdBy?.username || t("system")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
