"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import OrdersTable from "@/app/_components/table/OrdersTable";
import ActionButton from "@/app/_components/form/ActionButton";
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
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [totalRevenue, setTotalRevenue] = useState(initialData.totalRevenue);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPage = useCallback(async (cursor?: string) => {
    setIsLoading(true);
    try {
      const data = await fetchOrders(cursor);
      setOrders(data.orders);
      setNextCursor(data.nextCursor);
      setTotalCount(data.totalCount);
      setTotalRevenue(data.totalRevenue);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNextPage = async () => {
    if (!nextCursor) return;
    const currentFirstId = orders[0]?.id;
    if (currentFirstId) {
      setPrevCursors(prev => [...prev, currentFirstId]);
    }
    await loadPage(nextCursor);
  };

  const handlePrevPage = async () => {
    if (prevCursors.length === 0) return;
    const newPrevCursors = [...prevCursors];
    newPrevCursors.pop();
    setPrevCursors(newPrevCursors);

    if (newPrevCursors.length === 0) {
      await loadPage(undefined);
    } else {
      await loadPage(newPrevCursors[newPrevCursors.length - 1]);
    }
  };

  const handleRefresh = async () => {
    setPrevCursors([]);
    await loadPage(undefined);
  };

  const handleOrderClick = (order: SerializedOrder) => {
    router.push(`/admin/orders/${order.id}`);
  };

  const currentPage = prevCursors.length + 1;
  const totalPages = Math.ceil(totalCount / 50);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Total Revenue:{" "}
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <ActionButton
            onClick={handlePrevPage}
            disabled={isLoading || prevCursors.length === 0}
            size="sm"
            variant="secondary"
          >
            Previous
          </ActionButton>
          <ActionButton
            onClick={handleNextPage}
            disabled={isLoading || !nextCursor}
            size="sm"
            variant="secondary"
          >
            Next
          </ActionButton>
        </div>
      </div>

    </>
  );
}
