"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import WalletsTable from "@/app/_components/table/WalletsTable";
import Pagination from "@/app/_components/table/Pagination";
import { fetchWalletsAction } from "@/domain/wallet/actions/fetchWalletsAction";
import type { PaginatedWallets, SerializedWallet } from "@/domain/wallet/types";

interface WalletsDisplayProps {
  initialData: PaginatedWallets;
}

export default function WalletsDisplay({ initialData }: WalletsDisplayProps) {
  const router = useRouter();
  const [wallets, setWallets] = useState(initialData.wallets);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadPage = useCallback(async (page: number, searchQuery?: string) => {
    setIsLoading(true);
    try {
      const data = await fetchWalletsAction(page, searchQuery);
      setWallets(data.wallets);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePageChange = (page: number) => {
    loadPage(page, search);
  };

  const handleRefresh = () => {
    loadPage(currentPage, search);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPage(1, search);
  };

  const handleWalletClick = (wallet: SerializedWallet) => {
    router.push(`/admin/wallets/${wallet.id}`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Total Wallets:{" "}
            <strong className="text-gray-900">{totalCount}</strong>
          </div>
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

      <div className="overflow-x-auto">
        <WalletsTable wallets={wallets} onRowClick={handleWalletClick} />
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
