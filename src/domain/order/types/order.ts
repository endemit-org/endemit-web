import { ProductCategory, ProductImage } from "@/domain/product/types/product";

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
  price: number;
  quantity: number;
  currency: string;
  category: ProductCategory;
  checkoutDescription: string;
}
