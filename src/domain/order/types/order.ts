import {
  ProductCategory,
  ProductImage,
  ProductType,
} from "@/domain/product/types/product";

export enum OrderQueueEvent {
  NOTIFY_ON_ORDER = "notify-on-order",
  NOTIFY_ON_REFUND = "notify-on-refund",
}

export type OrderNotificationData = {
  orderId: string;
  metadata?: Record<string, string | number | boolean>;
};

export type RefundNotificationData = {
  orderId: string;
  refundedAmount: number;
  refundedItems: {
    itemIndex: number;
    itemName: string;
    quantity: number;
    amount: number;
  }[];
  shippingRefunded?: number;
  ticketsRefunded: boolean;
};

export interface ProductInOrder {
  id: string;
  uid: string;
  name: string;
  image: ProductImage;
  type: ProductType;
  category: ProductCategory;
  relatedEvent: string | null;
  price: number;
  quantity: number;
  currency: string;
  checkoutDescription: string;
  walletTopupReward: number | null;
  metadata?: Record<string, string | number | boolean | string[]>;
}
