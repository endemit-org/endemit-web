"use client";

import type { SerializedWallet } from "@/domain/wallet/types";
import type {
  WalletSortBy,
  WalletSortDir,
} from "@/domain/wallet/operations/getAllWallets";
import { useTranslations } from "next-intl";
import { formatTokensFromCents } from "@/lib/util/currency";
import ClientDate from "@/app/_components/ui/ClientDate";
import Link from "next/link";

interface WalletsTableProps {
  wallets: SerializedWallet[];
  onRowClick?: (wallet: SerializedWallet) => void;
  /** Renders every cell as a real anchor so rows middle/ctrl-click into new tabs. */
  rowHref?: (wallet: SerializedWallet) => string;
  sortBy?: WalletSortBy;
  sortDir?: WalletSortDir;
  onSortChange?: (sortBy: WalletSortBy) => void;
}

export default function WalletsTable({
  wallets,
  onRowClick,
  rowHref,
  sortBy,
  sortDir,
  onSortChange,
}: WalletsTableProps) {
  const t = useTranslations("admin.wallets");
  if (wallets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        {t("noWallets")}
      </div>
    );
  }

  return (
    <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t("col.user")}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t("col.email")}
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            {onSortChange ? (
              <button
                onClick={() => onSortChange("balance")}
                className="uppercase tracking-wider hover:text-gray-700"
              >
                {t("col.balance")}
                {sortBy === "balance" && (sortDir === "asc" ? " ▲" : " ▼")}
              </button>
            ) : (
              t("col.balance")
            )}
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            {onSortChange ? (
              <button
                onClick={() => onSortChange("transactions")}
                className="uppercase tracking-wider hover:text-gray-700"
              >
                {t("col.transactions")}
                {sortBy === "transactions" && (sortDir === "asc" ? " ▲" : " ▼")}
              </button>
            ) : (
              t("col.transactions")
            )}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t("col.lastUpdated")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {wallets.map(wallet => {
          // An <a> can't wrap a <tr>, so with rowHref each cell carries its
          // own full-size anchor to keep the whole row clickable while
          // supporting middle/ctrl/shift-click.
          const cell = (
            content: React.ReactNode,
            className: string,
            tabbable = false
          ) =>
            rowHref ? (
              <td className={className.replace("px-6 py-4 ", "")}>
                <Link
                  href={rowHref(wallet)}
                  className="block px-6 py-4"
                  tabIndex={tabbable ? undefined : -1}
                >
                  {content}
                </Link>
              </td>
            ) : (
              <td className={className}>{content}</td>
            );

          return (
            <tr
              key={wallet.id}
              onClick={onRowClick ? () => onRowClick(wallet) : undefined}
              className={
                onRowClick || rowHref ? "cursor-pointer hover:bg-gray-50" : ""
              }
            >
              {cell(
                <>
                  <div className="text-sm font-medium text-gray-900">
                    {wallet.user?.name || wallet.user?.username || t("unknown")}
                  </div>
                  {wallet.user?.name && (
                    <div className="text-sm text-gray-500">
                      {wallet.user.username}
                    </div>
                  )}
                </>,
                "px-6 py-4 whitespace-nowrap",
                true
              )}
              {cell(
                wallet.user?.email || "-",
                "px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              )}
              {cell(
                <span
                  className={`text-sm font-medium ${
                    wallet.balance > 0
                      ? "text-green-600"
                      : wallet.balance < 0
                        ? "text-red-600"
                        : "text-gray-500"
                  }`}
                >
                  {formatTokensFromCents(wallet.balance)}
                </span>,
                "px-6 py-4 whitespace-nowrap text-right"
              )}
              {cell(
                wallet.transactionCount ?? 0,
                "px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900"
              )}
              {cell(
                <ClientDate date={wallet.updatedAt} />,
                "px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
