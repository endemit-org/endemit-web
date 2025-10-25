import "server-only";

import { updateOrderStatusExpired } from "@/domain/order/operations/updateOrderStatus";

export const onOrderPaymentExpired = async (orderId: string) => {
  return await updateOrderStatusExpired(orderId);
};
