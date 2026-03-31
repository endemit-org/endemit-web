"use client";

import type { SerializedWallet } from "@/domain/wallet/types";
import { formatDateTime } from "@/lib/util/formatting";
import { formatTokensFromCents } from "@/lib/util/currency";

interface WalletsTableProps {
  wallets: SerializedWallet[];
  onRowClick?: (wallet: SerializedWallet) => void;
}

export default function WalletsTable({
  wallets,
  onRowClick,
}: WalletsTableProps) {
  if (wallets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No wallets found
      </div>
    );
  }

  return (
    <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            User
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Balance
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Last Updated
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
                {wallet.user?.name || wallet.user?.username || "Unknown"}
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
              {formatDateTime(new Date(wallet.updatedAt))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
