"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import OrdersTable from "@/app/_components/table/OrdersTable";
import Pagination from "@/app/_components/table/Pagination";
import { fetchOrders } from "@/domain/order/actions/fetchOrdersAction";
import { formatPrice } from "@/lib/util/formatting";
import type {
  PaginatedOrders,
  SerializedOrder,
} from "@/domain/order/types/serialized";

interface OrdersDisplayProps {
  initialData: PaginatedOrders;
}

export default function OrdersDisplay({ initialData }: OrdersDisplayProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialData.orders);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [totalRevenue, setTotalRevenue] = useState(initialData.totalRevenue);
  const [isLoading, setIsLoading] = useState(false);

  const loadPage = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const data = await fetchOrders(page);
      setOrders(data.orders);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setTotalRevenue(data.totalRevenue);
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

  const handleOrderClick = (order: SerializedOrder) => {
    router.push(`/admin/orders/${order.id}`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Revenue:{" "}
            <strong className="text-green-600 text-lg">
              {formatPrice(totalRevenue)}
            </strong>
          </div>
          <div className="text-sm text-gray-600">
            Orders: <strong className="text-gray-900">{totalCount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Showing: <strong className="text-gray-900">{orders.length}</strong>
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
        <OrdersTable orders={orders} onRowClick={handleOrderClick} />
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
