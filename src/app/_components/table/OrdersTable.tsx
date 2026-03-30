"use client";

import { Column, Table } from "@/app/_components/table/Table";
import { SerializedOrder } from "@/domain/order/types/serialized";
import { formatPrice, formatDateTime } from "@/lib/util/formatting";
import clsx from "clsx";

const statusColors: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  REFUND_REQUESTED: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-purple-100 text-purple-800",
};

export default function OrdersTable({
  orders,
  onRowClick,
}: {
  orders: SerializedOrder[];
  onRowClick?: (row: SerializedOrder) => void;
}) {
  const columns: Column<SerializedOrder>[] = [
    {
      key: "id",
      header: "Order ID",
      sortable: true,
      render: order => (
        <span className="font-mono text-xs">{order.id.slice(0, 12)}...</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: order => (
        <span className="text-sm">{order.email}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: order => (
        <span
          className={clsx(
            "rounded-full px-2 py-1 text-xs font-medium",
            statusColors[order.status] || "bg-gray-100 text-gray-800"
          )}
        >
          {order.status}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      sortable: true,
      render: order => (
        <span className="font-medium">{formatPrice(order.totalAmount)}</span>
      ),
    },
    {
      key: "ticketCount",
      header: "Tickets",
      sortable: true,
      render: order => (
        <span
          className={clsx(
            "font-medium",
            order.ticketCount > 0 ? "text-blue-600" : "text-gray-500"
          )}
        >
          {order.ticketCount}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: order => (
        <span className="text-sm text-gray-600">
          {formatDateTime(new Date(order.createdAt))}
        </span>
      ),
      accessor: order => new Date(order.createdAt).getTime(),
    },
  ];

  return (
    <Table
      data={orders}
      columns={columns}
      onRowClick={onRowClick}
      emptyMessage="No orders found"
      maxHeight="calc(100vh - 400px)"
    />
  );
}
