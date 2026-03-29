import "server-only";

import { supabaseServer } from "./server";

export type BroadcastEvent =
  | "balance_updated"
  | "order_status_updated"
  | "transaction_confirmed";

export interface BroadcastPayload {
  balance_updated: { balance: number };
  order_status_updated: { orderId: string; status: string };
  transaction_confirmed: { transactionId: string; success: boolean };
}

/**
 * Broadcast a message to a specific user's channel.
 * Use this from server-side (API routes, Inngest functions) after DB updates.
 */
export async function broadcastToUser<E extends BroadcastEvent>(
  userId: string,
  event: E,
  payload: BroadcastPayload[E]
): Promise<void> {
  const channel = supabaseServer.channel(`user:${userId}`);

  await channel.send({
    type: "broadcast",
    event,
    payload,
  });

  await supabaseServer.removeChannel(channel);
}

/**
 * Broadcast a message to a custom channel.
 * Useful for order-specific or transaction-specific updates.
 */
export async function broadcastToChannel<E extends BroadcastEvent>(
  channelName: string,
  event: E,
  payload: BroadcastPayload[E]
): Promise<void> {
  const channel = supabaseServer.channel(channelName);

  await channel.send({
    type: "broadcast",
    event,
    payload,
  });

  await supabaseServer.removeChannel(channel);
}
