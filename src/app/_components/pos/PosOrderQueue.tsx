"use client";

import { useEffect, useState } from "react";
import { formatTokensFromCents } from "@/lib/util/currency";

interface PosOrderSummary {
  id: string;
  shortCode: string;
  orderHash: string;
  subtotal: number;
  total: number;
  status: string;
  scannedAt: string | null;
  expiresAt: string;
  createdAt: string;
  items: Array<{ itemId: string; name: string; quantity: number; total: number }>;
  customerName?: string;
  hasEnoughBalance?: boolean;
}

interface Props {
  orders: PosOrderSummary[];
  onSelectOrder: (order: PosOrderSummary) => void;
  onCancelOrder: (orderHash: string) => void;
  selectedOrderId?: string;
}

function TimeRemaining({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isLow =
    remaining !== "Expired" &&
    parseInt(remaining.split(":")[0]) < 3;

  return (
    <span
      className={`text-xs font-mono ${
        remaining === "Expired"
          ? "text-red-600"
          : isLow
          ? "text-orange-600"
          : "text-gray-500"
      }`}
    >
      {remaining}
    </span>
  );
}

export function PosOrderQueue({
  orders,
  onSelectOrder,
  onCancelOrder,
  selectedOrderId,
}: Props) {
  if (orders.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Pending Orders
        </h2>
        <p className="text-sm text-gray-400 text-center py-8">
          No pending orders
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        Pending Orders ({orders.length})
      </h2>
      <div className="space-y-2">
        {orders.map(order => (
          <div
            key={order.id}
            className={`rounded-lg border-2 transition-colors cursor-pointer ${
              selectedOrderId === order.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
            onClick={() => onSelectOrder(order)}
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-medium text-sm">
                  {order.shortCode}
                </span>
                <TimeRemaining expiresAt={order.expiresAt} />
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                {order.items.slice(0, 2).map((item, i) => (
                  <div key={i}>
                    {item.quantity}x {item.name}
                  </div>
                ))}
                {order.items.length > 2 && (
                  <div className="text-gray-400">
                    +{order.items.length - 2} more
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="font-medium">{formatTokensFromCents(order.total)}</span>
                {order.scannedAt ? (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      order.hasEnoughBalance === false
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {order.hasEnoughBalance === false
                      ? "Low balance"
                      : `Scanned by ${order.customerName || "customer"}`}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">
                    Waiting for scan
                  </span>
                )}
              </div>
            </div>

            <div className="border-t px-3 py-2 flex justify-end">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onCancelOrder(order.orderHash);
                }}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
