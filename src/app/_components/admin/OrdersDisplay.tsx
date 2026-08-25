"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import OrdersTable from "@/app/_components/table/OrdersTable";
import Pagination from "@/app/_components/table/Pagination";
import { fetchOrders } from "@/domain/order/actions/fetchOrdersAction";
import { formatPrice } from "@/lib/util/formatting";
import type { PaginatedOrders } from "@/domain/order/types/serialized";

interface OrdersDisplayProps {
  initialData: PaginatedOrders;
}

// Mirrors the Prisma OrderStatus enum; labels come from admin.status.order.
const ORDER_STATUSES = [
  "CREATED",
  "PROCESSING",
  "PAID",
  "PREPARING",
  "IN_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUND_REQUESTED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

const SEARCH_DEBOUNCE_MS = 350;

export default function OrdersDisplay({ initialData }: OrdersDisplayProps) {
  const t = useTranslations("admin.orders");
  const tc = useTranslations("admin.common");
  const ts = useTranslations("admin.status.order");
  const [orders, setOrders] = useState(initialData.orders);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [totalRevenue, setTotalRevenue] = useState(initialData.totalRevenue);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // Guards against out-of-order responses when typing quickly.
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    async (page: number, searchValue: string, statusValue: string) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        const data = await fetchOrders(page, {
          search: searchValue,
          status: statusValue,
        });
        if (requestId !== requestIdRef.current) return;
        setOrders(data.orders);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setTotalRevenue(data.totalRevenue);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // Re-query from page 1 whenever filters change (debounced for typing).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(
      () => loadPage(1, search, statusFilter),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timeout);
  }, [search, statusFilter, loadPage]);

  const handlePageChange = (page: number) => {
    loadPage(page, search, statusFilter);
  };

  const handleRefresh = () => {
    loadPage(currentPage, search, statusFilter);
  };

  return (
    <>
      <div className="flex flex-col gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:border-blue-500"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white sm:w-56"
          >
            <option value="">{t("list.allStatuses")}</option>
            {ORDER_STATUSES.map(status => (
              <option key={status} value={status}>
                {ts(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="text-sm text-gray-600">
              {t("list.paidNotComplete")}{" "}
              <strong className="text-green-600 text-lg">
                {formatPrice(totalRevenue)}
              </strong>
            </div>
            <div className="text-sm text-gray-600">
              {t("list.ordersLabel")}{" "}
              <strong className="text-gray-900">{totalCount}</strong>
            </div>
            <div className="text-sm text-gray-600">
              {t("list.showingLabel")}{" "}
              <strong className="text-gray-900">{orders.length}</strong>
            </div>
          </div>
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
        <OrdersTable
          orders={orders}
          rowHref={order => `/admin/orders/${order.id}`}
        />
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
