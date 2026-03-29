"use client";

import { useState } from "react";
import type { SerializedOrder } from "@/domain/order/types/serialized";
import type { ProductInOrder } from "@/domain/order/types/order";

interface OrderCardProps {
  order: SerializedOrder;
}

const statusColors: Record<string, string> = {
  PAID: "bg-green-500/20 text-green-400",
  CREATED: "bg-yellow-500/20 text-yellow-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-gray-500/20 text-gray-400",
  EXPIRED: "bg-gray-500/20 text-gray-400",
};

export default function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const items = order.items as ProductInOrder[];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-neutral-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-neutral-700/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono text-neutral-400">
                #{order.id.slice(-8)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-gray-500/20 text-gray-400"}`}
              >
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <span>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="font-medium">
                €{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">{formattedDate}</span>
            <svg
              className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-neutral-700">
          <div className="pt-4 space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-neutral-300">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-neutral-500">×{item.quantity}</span>
                  )}
                </div>
                <span className="text-neutral-400">
                  €{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            {order.shippingAmount && order.shippingAmount > 0 && (
              <div className="flex justify-between items-center text-sm pt-2 border-t border-neutral-700">
                <span className="text-neutral-400">Shipping</span>
                <span className="text-neutral-400">
                  €{order.shippingAmount.toFixed(2)}
                </span>
              </div>
            )}

            {order.discountAmount && order.discountAmount < 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-400">Discount</span>
                <span className="text-green-400">
                  €{order.discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm pt-2 border-t border-neutral-700">
              <span className="font-medium text-neutral-200">Total</span>
              <span className="font-medium text-neutral-200">
                €{order.totalAmount.toFixed(2)}
              </span>
            </div>

            {order.ticketCount > 0 && (
              <div className="pt-2">
                <span className="text-xs text-blue-400">
                  {order.ticketCount}{" "}
                  {order.ticketCount === 1 ? "ticket" : "tickets"} included
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
