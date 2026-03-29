"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import UsersTable from "@/app/_components/table/UsersTable";
import Pagination from "@/app/_components/table/Pagination";
import { fetchUsers } from "@/domain/user/actions/fetchUsersAction";
import type { PaginatedUsers, SerializedUser } from "@/domain/user/types";

interface UsersDisplayProps {
  initialData: PaginatedUsers;
}

export default function UsersDisplay({ initialData }: UsersDisplayProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialData.users);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [isLoading, setIsLoading] = useState(false);

  const loadPage = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const data = await fetchUsers(page);
      setUsers(data.users);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePageChange = (page: number) => {
    loadPage(page);
  };

  const handleRefresh = () => {
    loadPage(currentPage);
  };

  const handleUserClick = (user: SerializedUser) => {
    router.push(`/admin/users/${user.id}`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Total Users:{" "}
            <strong className="text-gray-900">{totalCount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Showing: <strong className="text-gray-900">{users.length}</strong>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <UsersTable users={users} onRowClick={handleUserClick} />
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
