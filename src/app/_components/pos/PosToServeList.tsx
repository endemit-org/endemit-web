"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export interface ToServeOrder {
  id: string;
  orderHash: string;
  shortCode: string;
  queueNumber: number | null;
  note: string | null;
  paidAt: string;
  items: Array<{ name: string; quantity: number }>;
}

interface Props {
  registerId: string;
  /** Bump to refetch (realtime paid/fulfilled events). */
  refreshKey?: number;
  onCountChange?: (count: number) => void;
}

function AgeTimer({ since }: { since: string }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => forceTick(n => n + 1), 30_000);
    return () => clearInterval(timer);
  }, []);
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(since).getTime()) / 60_000)
  );
  return (
    <span
      className={
        minutes >= 10
          ? "text-red-600 font-semibold"
          : minutes >= 5
            ? "text-amber-600"
            : "text-gray-400"
      }
    >
      {minutes} min
    </span>
  );
}

/** Paid orders awaiting serving (food-stand registers). */
export function PosToServeList({ registerId, refreshKey = 0, onCountChange }: Props) {
  const t = useTranslations("pos.toServe");
  const [orders, setOrders] = useState<ToServeOrder[] | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/pos/registers/${registerId}/to-serve`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders);
        onCountChange?.(data.orders.length);
      }
    } catch {
      // keep last state
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleComplete = async (order: ToServeOrder) => {
    setCompletingIds(prev => new Set(prev).add(order.id));
    try {
      const response = await fetch(
        `/api/v1/pos/orders/${order.orderHash}/complete`,
        { method: "POST" }
      );
      if (response.ok) {
        setOrders(prev => {
          const next = (prev ?? []).filter(o => o.id !== order.id);
          onCountChange?.(next.length);
          return next;
        });
      }
    } finally {
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">{t("empty")}</div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {orders.map(order => (
        <div
          key={order.id}
          className="border-2 border-orange-200 bg-orange-50/50 rounded-lg px-3 py-2"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xl font-bold text-orange-700">
              #{order.queueNumber ?? order.shortCode}
            </span>
            <AgeTimer since={order.paidAt} />
          </div>
          <div className="text-xs text-gray-700">
            {order.items
              .map(item => `${item.quantity}x ${item.name}`)
              .join(", ")}
          </div>
          {order.note && (
            <div className="text-xs font-medium text-amber-700 bg-amber-100 rounded px-2 py-1 mt-1">
              {order.note}
            </div>
          )}
          <button
            onClick={() => handleComplete(order)}
            disabled={completingIds.has(order.id)}
            className="w-full mt-2 px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
          >
            {completingIds.has(order.id) ? t("completing") : t("complete")}
          </button>
        </div>
      ))}
    </div>
  );
}
