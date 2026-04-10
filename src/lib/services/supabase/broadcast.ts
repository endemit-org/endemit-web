import "server-only";

import { supabaseServer } from "./server";

export type BroadcastEvent =
  | "balance_updated"
  | "order_status_updated"
  | "transaction_confirmed"
  | "wallet_transaction_created"
  | "pos_order_scanned"
  | "pos_order_paid"
  | "pos_order_cancelled"
  | "ticket_scanned"
  | "ticket_scan_reverted"
  | "announcement_created"
  | "announcement_updated"
  | "announcement_deleted";

export interface WalletTransactionPayload {
  transactionId: string;
  walletId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
}

export interface PosOrderScannedPayload {
  orderId: string;
  shortCode: string;
  customerId: string;
  customerName: string;
  customerFirstName: string | null;
  customerImage: string | null;
  balance: number;
  hasEnoughBalance: boolean;
}

export interface PosOrderPaidPayload {
  orderId: string;
  shortCode: string;
  total: number;
  tipAmount: number;
  paidAt: string;
}

export interface PosOrderCancelledPayload {
  orderId: string;
  shortCode: string;
  reason: "seller" | "expired";
}

export interface TicketScannedPayload {
  ticketId: string;
  shortId: string;
  status: string;
  scannedAt: string;
}

export interface TicketScanRevertedPayload {
  ticketId: string;
  shortId: string;
  status: string;
  revertedAt: string;
}

export interface AnnouncementPayload {
  id: string;
  title: string | null;
  message: string;
  type: "INFO" | "WARNING";
}

export interface AnnouncementDeletedPayload {
  id: string;
}

export interface BroadcastPayload {
  balance_updated: { balance: number };
  order_status_updated: { orderId: string; status: string };
  transaction_confirmed: { transactionId: string; success: boolean };
  wallet_transaction_created: WalletTransactionPayload;
  pos_order_scanned: PosOrderScannedPayload;
  pos_order_paid: PosOrderPaidPayload;
  pos_order_cancelled: PosOrderCancelledPayload;
  ticket_scanned: TicketScannedPayload;
  ticket_scan_reverted: TicketScanRevertedPayload;
  announcement_created: AnnouncementPayload;
  announcement_updated: AnnouncementPayload;
  announcement_deleted: AnnouncementDeletedPayload;
}

/**
 * Broadcast a message to a specific user's channel.
 * Use this from server-side (API routes, Inngest functions) after DB updates.
 *
 * Uses httpSend() for direct HTTP REST delivery - optimal for serverless.
 * No WebSocket connection attempt, no fallback warning.
 */
export async function broadcastToUser<E extends BroadcastEvent>(
  userId: string,
  event: E,
  payload: BroadcastPayload[E]
): Promise<void> {
  const channel = supabaseServer.channel(`user:${userId}`);

  await channel.httpSend(event, payload);

  await supabaseServer.removeChannel(channel);
}

/**
 * Broadcast a message to a custom channel.
 * Useful for order-specific or transaction-specific updates.
 *
 * Uses httpSend() for direct HTTP REST delivery - optimal for serverless.
 * No WebSocket connection attempt, no fallback warning.
 */
export async function broadcastToChannel<E extends BroadcastEvent>(
  channelName: string,
  event: E,
  payload: BroadcastPayload[E]
): Promise<void> {
  const channel = supabaseServer.channel(channelName);

  await channel.httpSend(event, payload);

  await supabaseServer.removeChannel(channel);
}
