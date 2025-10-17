export enum OrderQueueEvent {
  NOTIFY_ON_ORDER = "notify-on-order",
}

export type OrderNotificationData = {
  orderId: string;
  metadata?: Record<string, string | number | boolean>;
};
