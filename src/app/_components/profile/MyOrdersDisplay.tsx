"use client";

import type { SerializedOrder } from "@/domain/order/types/serialized";
import OrderCard from "./OrderCard";

interface MyOrdersDisplayProps {
  orders: SerializedOrder[];
}

export default function MyOrdersDisplay({ orders }: MyOrdersDisplayProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-300 mb-2">
          No orders yet
        </h3>
        <p className="text-neutral-500">
          When you make a purchase, your orders will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
