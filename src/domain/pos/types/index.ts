import type {
  PosItem,
  PosRegister,
  PosOrder,
  PosOrderItem,
  PosOrderStatus,
} from "@prisma/client";

export interface PosOrderPayload {
  registerId: string;
  sellerId: string;
  subtotal: number;
  createdAt: string;
}

export interface CreatePosOrderInput {
  registerId: string;
  sellerId: string;
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
  /** Whether the seller may sell CREDIT (top-up) items — pos:topup holders. */
  allowCreditItems?: boolean;
  /** Serving note ("no onions, blue jacket") shown on the to-serve card. */
  note?: string;
  /** Pre-attach a scanned wallet customer (balance-check "use for order"). */
  attachedCustomerId?: string;
}

export interface PosOrderWithDetails extends PosOrder {
  items: (PosOrderItem & { item: PosItem })[];
  register: PosRegister;
}

export interface ScanPosOrderResult {
  order: PosOrderWithDetails;
  customer: {
    id: string;
    name: string | null;
    balance: number;
  };
  hasEnoughBalance: boolean;
}

export interface PayPosOrderInput {
  orderHash: string;
  customerId: string;
  tipAmount: number;
}

export interface PayPosOrderResult {
  success: boolean;
  order: PosOrder;
  transaction: {
    id: string;
    amount: number;
    balanceAfter: number;
  };
}

export type { PosItem, PosRegister, PosOrder, PosOrderItem, PosOrderStatus };

// Inngest queue events
export enum PosQueueEvent {
  NOTIFY_ON_TRANSACTION = "pos/notify.transaction",
}

export interface PosTransactionNotificationData {
  orderId: string;
}
