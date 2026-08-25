"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import UsersTable from "@/app/_components/table/UsersTable";
import Pagination from "@/app/_components/table/Pagination";
import UserCreateForm from "@/app/_components/admin/UserCreateForm";
import { fetchUsers } from "@/domain/user/actions/fetchUsersAction";
import type { PaginatedUsers } from "@/domain/user/types";

interface UsersDisplayProps {
  initialData: PaginatedUsers;
  canCreateUsers?: boolean;
}

export default function UsersDisplay({
  initialData,
  canCreateUsers = false,
}: UsersDisplayProps) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("admin.common");
  const [users, setUsers] = useState(initialData.users);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");

  const loadPage = useCallback(async (page: number, searchQuery?: string) => {
    setIsLoading(true);
    try {
      const data = await fetchUsers(page, searchQuery);
      setUsers(data.users);
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

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            {t("list.total")}{" "}
            <strong className="text-gray-900">{totalCount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            {tc("showing")}{" "}
            <strong className="text-gray-900">{users.length}</strong>
          </div>
        </div>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("list.searchPlaceholder")}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {tc("search")}
            </button>
          </form>
          {canCreateUsers && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              {t("list.addUser")}
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? tc("loading") : tc("refresh")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <UsersTable users={users} rowHref={user => `/admin/users/${user.id}`} />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      {canCreateUsers && (
        <UserCreateForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            handleRefresh();
          }}
        />
      )}
    </>
  );
}
