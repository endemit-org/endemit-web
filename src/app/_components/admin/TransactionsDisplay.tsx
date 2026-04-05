"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { fetchTransactionsAction } from "@/domain/wallet/actions/fetchTransactionsAction";
import type { PaginatedTransactions } from "@/domain/wallet/types";
import type { WalletTransactionType } from "@prisma/client";
import { formatTokensFromCents } from "@/lib/util/currency";
import ClientDate from "@/app/_components/ui/ClientDate";
import Pagination from "@/app/_components/table/Pagination";
import clsx from "clsx";

interface TransactionsDisplayProps {
  initialData: PaginatedTransactions;
}

const typeLabels: Record<string, string> = {
  CREDIT: "Credit",
  DEBIT: "Debit",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

const typeColors: Record<string, string> = {
  CREDIT: "bg-green-100 text-green-800",
  DEBIT: "bg-red-100 text-red-800",
  PURCHASE: "bg-blue-100 text-blue-800",
  REFUND: "bg-purple-100 text-purple-800",
  ADJUSTMENT: "bg-yellow-100 text-yellow-800",
};

const transactionTypes: WalletTransactionType[] = [
  "CREDIT",
  "DEBIT",
  "PURCHASE",
  "REFUND",
  "ADJUSTMENT",
];

export default function TransactionsDisplay({
  initialData,
}: TransactionsDisplayProps) {
  const [transactions, setTransactions] = useState(initialData.transactions);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<WalletTransactionType | "">("");
  const [search, setSearch] = useState("");

  const loadPage = useCallback(
    async (
      page: number,
      type?: WalletTransactionType,
      searchQuery?: string
    ) => {
      setIsLoading(true);
      try {
        const data = await fetchTransactionsAction(
          page,
          type || undefined,
          searchQuery || undefined
        );
        setTransactions(data.transactions);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handlePageChange = (page: number) => {
    loadPage(page, typeFilter || undefined, search);
  };

  const handleRefresh = () => {
    loadPage(currentPage, typeFilter || undefined, search);
  };

  const handleFilterChange = (type: WalletTransactionType | "") => {
    setTypeFilter(type);
    loadPage(1, type || undefined, search);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPage(1, typeFilter || undefined, search);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Total:{" "}
            <strong className="text-gray-900">{totalCount}</strong>
          </div>
          <select
            value={typeFilter}
            onChange={e =>
              handleFilterChange(e.target.value as WalletTransactionType | "")
            }
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {transactionTypes.map(type => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by user..."
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              Search
            </button>
          </form>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance After
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <ClientDate date={tx.createdAt} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/wallets/${tx.walletId}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {tx.wallet.user.name ||
                        tx.wallet.user.username ||
                        tx.wallet.user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={clsx(
                        "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                        typeColors[tx.type] || "bg-gray-100 text-gray-800"
                      )}
                    >
                      {typeLabels[tx.type] || tx.type}
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
                    {tx.createdBy?.name || tx.createdBy?.username || "System"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </>
  );
}
