import type {
  PosItem,
  PosRegister,
  PosOrder,
  PosOrderItem,
  PosOrderStatus,
} from "@prisma/client";

export interface PosOrderPayload {
  orderId: string;
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
