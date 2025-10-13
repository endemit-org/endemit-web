import { updateOrderStatusExpired } from "@/domain/order/actions";

export const onOrderPaymentExpired = async (orderId: string) => {
  return await updateOrderStatusExpired(orderId);
};
