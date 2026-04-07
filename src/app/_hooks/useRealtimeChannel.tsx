"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabaseClient } from "@/lib/services/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type BroadcastEvent =
  | "balance_updated"
  | "order_status_updated"
  | "transaction_confirmed"
  | "wallet_transaction_created"
  | "pos_order_scanned"
  | "pos_order_paid"
  | "pos_order_cancelled"
  | "ticket_scanned"
  | "announcement_created"
  | "announcement_updated"
  | "announcement_deleted";

interface WalletTransactionPayload {
  transactionId: string;
  walletId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
}

interface PosOrderScannedPayload {
  orderId: string;
  shortCode: string;
  customerId: string;
  customerName: string;
  customerFirstName: string | null;
  customerImage: string | null;
  balance: number;
  hasEnoughBalance: boolean;
}

interface PosOrderPaidPayload {
  orderId: string;
  shortCode: string;
  total: number;
  tipAmount: number;
  paidAt: string;
}

interface PosOrderCancelledPayload {
  orderId: string;
  shortCode: string;
  reason: "seller" | "expired";
}

interface TicketScannedPayload {
  ticketId: string;
  shortId: string;
  status: string;
  scannedAt: string;
}

interface AnnouncementPayload {
  id: string;
  title: string | null;
  message: string;
  type: "INFO" | "WARNING";
}

interface AnnouncementDeletedPayload {
  id: string;
}

interface BroadcastPayload {
  balance_updated: { balance: number };
  order_status_updated: { orderId: string; status: string };
  transaction_confirmed: { transactionId: string; success: boolean };
  wallet_transaction_created: WalletTransactionPayload;
  pos_order_scanned: PosOrderScannedPayload;
  pos_order_paid: PosOrderPaidPayload;
  pos_order_cancelled: PosOrderCancelledPayload;
  ticket_scanned: TicketScannedPayload;
  announcement_created: AnnouncementPayload;
  announcement_updated: AnnouncementPayload;
  announcement_deleted: AnnouncementDeletedPayload;
}

type EventHandler<E extends BroadcastEvent> = (
  payload: BroadcastPayload[E]
) => void;

interface UseRealtimeChannelOptions<E extends BroadcastEvent> {
  channelName: string;
  event: E;
  onMessage: EventHandler<E>;
  enabled?: boolean;
}

/**
 * Subscribe to a Supabase Realtime Broadcast channel.
 *
 * @example
 * // Subscribe to user-specific balance updates
 * useRealtimeChannel({
 *   channelName: `user:${userId}`,
 *   event: 'balance_updated',
 *   onMessage: (payload) => setBalance(payload.balance),
 * });
 *
 * @example
 * // Subscribe to order status updates
 * useRealtimeChannel({
 *   channelName: `order:${orderId}`,
 *   event: 'order_status_updated',
 *   onMessage: (payload) => setOrderStatus(payload.status),
 *   enabled: !!orderId,
 * });
 */
export function useRealtimeChannel<E extends BroadcastEvent>({
  channelName,
  event,
  onMessage,
  enabled = true,
}: UseRealtimeChannelOptions<E>): void {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref updated without triggering re-subscription
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const subscribe = useCallback(() => {
    if (!enabled || !channelName) return;

    const channel = supabaseClient
      .channel(channelName)
      .on("broadcast", { event }, ({ payload }) => {
        onMessageRef.current(payload as BroadcastPayload[E]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, event, enabled]);

  useEffect(() => {
    const cleanup = subscribe();
    return cleanup;
  }, [subscribe]);
}
