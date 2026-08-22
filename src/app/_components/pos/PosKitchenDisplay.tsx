"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import type { ToServeOrder } from "./PosToServeList";

interface Props {
  registerId: string;
  registerName: string;
  initialOrders: ToServeOrder[];
}

function AgeBadge({ since }: { since: string }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => forceTick(n => n + 1), 15_000);
    return () => clearInterval(timer);
  }, []);
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(since).getTime()) / 60_000)
  );
  return (
    <span
      className={`text-2xl font-bold ${
        minutes >= 10
          ? "text-red-400"
          : minutes >= 5
            ? "text-amber-400"
            : "text-neutral-400"
      }`}
    >
      {minutes}&apos;
    </span>
  );
}

/**
 * View-only kitchen display: paid orders awaiting preparation at this
 * register, auto-syncing via the register's realtime channel.
 */
export function PosKitchenDisplay({
  registerId,
  registerName,
  initialOrders,
}: Props) {
  const t = useTranslations("pos.kitchen");
  const [orders, setOrders] = useState<ToServeOrder[]>(initialOrders);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/pos/registers/${registerId}/to-serve`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (response.ok) setOrders(data.orders);
    } catch {
      // keep last state
    }
  }, [registerId]);

  useRealtimeChannel({
    channelName: `pos:register:${registerId}`,
    event: "pos_order_paid",
    onMessage: payload => {
      if (payload.fulfillmentStatus === "OPEN") refetch();
    },
  });

  useRealtimeChannel({
    channelName: `pos:register:${registerId}`,
    event: "pos_order_fulfilled",
    onMessage: payload => {
      setOrders(prev => prev.filter(o => o.id !== payload.orderId));
    },
  });

  // Safety net: realtime can drop on tablets that sleep — resync every 60s
  useEffect(() => {
    const timer = setInterval(refetch, 60_000);
    return () => clearInterval(timer);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-neutral-300">
          {t("title", { name: registerName })}
        </h1>
        <span className="text-xl font-bold text-orange-400">
          {t("openCount", { count: orders.length })}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center h-[70vh] text-3xl text-neutral-600">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-neutral-900 border-2 border-orange-500/40 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-5xl font-bold text-orange-400">
                  #{order.queueNumber ?? order.shortCode}
                </span>
                <AgeBadge since={order.paidAt} />
              </div>
              <ul className="space-y-1 text-xl">
                {order.items.map((item, i) => (
                  <li key={i}>
                    <span className="font-bold text-white">
                      {item.quantity}x
                    </span>{" "}
                    <span className="text-neutral-200">{item.name}</span>
                  </li>
                ))}
              </ul>
              {order.note && (
                <div className="mt-3 text-lg font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  {order.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
