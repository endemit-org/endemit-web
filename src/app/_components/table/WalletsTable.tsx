"use client";

import type { SerializedWallet } from "@/domain/wallet/types";
import { useTranslations } from "next-intl";
import { formatTokensFromCents } from "@/lib/util/currency";
import ClientDate from "@/app/_components/ui/ClientDate";

interface WalletsTableProps {
  wallets: SerializedWallet[];
  onRowClick?: (wallet: SerializedWallet) => void;
}

export default function WalletsTable({
  wallets,
  onRowClick,
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
            {t("col.balance")}
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t("col.lastUpdated")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {wallets.map(wallet => (
          <tr
            key={wallet.id}
            onClick={() => onRowClick?.(wallet)}
            className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">
                {wallet.user?.name || wallet.user?.username || t("unknown")}
              </div>
              {wallet.user?.name && (
                <div className="text-sm text-gray-500">
                  {wallet.user.username}
                </div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {wallet.user?.email || "-"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
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
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <ClientDate date={wallet.updatedAt} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
