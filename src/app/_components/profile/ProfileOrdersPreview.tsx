"use client";

import type { SerializedOrder } from "@/domain/order/types/serialized";
import { formatCurrency } from "@/lib/util/formatting";
import ShoppingBagIcon from "@/app/_components/icon/ShoppingBagIcon";
import ProfileTable, { ProfileTableRow } from "./ProfileTable";
import ClientDate from "@/app/_components/ui/ClientDate";

interface ProfileOrdersPreviewProps {
  orders: SerializedOrder[];
  totalCount: number;
}

const statusColors: Record<string, string> = {
  PAID: "bg-green-500/20 text-green-400",
  CREATED: "bg-yellow-500/20 text-yellow-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-gray-500/20 text-gray-400",
  EXPIRED: "bg-gray-500/20 text-gray-400",
};

export default function ProfileOrdersPreview({
  orders,
  totalCount,
}: ProfileOrdersPreviewProps) {
  return (
    <ProfileTable
      title="Orders"
      count={totalCount}
      countLabel={totalCount === 1 ? "order" : "orders"}
      viewAllHref="/profile/orders"
      isEmpty={orders.length === 0}
      emptyIcon={<ShoppingBagIcon className="w-6 h-6 text-neutral-500" />}
      emptyMessage="No orders yet"
    >
      {orders.map((order, index) => (
          <ProfileTableRow
            key={order.id}
            href={`/profile/orders/${order.id}`}
            index={index}
          >
            <div className="flex items-center gap-4">
              <ClientDate
                date={order.createdAt}
                format="date"
                className="text-sm text-neutral-400"
              />
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-gray-500/20 text-gray-400"}`}
              >
                {order.status}
              </span>
            </div>
            <div className="text-neutral-200 font-medium">
              {formatCurrency(order.totalAmount)}
            </div>
          </ProfileTableRow>
      ))}
    </ProfileTable>
  );
}
