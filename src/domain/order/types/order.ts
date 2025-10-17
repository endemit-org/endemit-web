import {
  ProductCategory,
  ProductImage,
  ProductType,
} from "@/domain/product/types/product";

export enum OrderQueueEvent {
  NOTIFY_ON_ORDER = "notify-on-order",
}

export type OrderNotificationData = {
  orderId: string;
  metadata?: Record<string, string | number | boolean>;
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
  metadata?: Record<string, string | number | boolean | string[]>;
}
