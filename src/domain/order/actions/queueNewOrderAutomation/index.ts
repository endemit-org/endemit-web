import { inngest } from "@/services/inngest";
import { OrderNotificationData, OrderQueueEvent } from "@/types/order";

export const queueNewOrderAutomation = async (data: OrderNotificationData) => {
  return await inngest.send({
    name: OrderQueueEvent.NOTIFY_ON_ORDER,
    data,
  });
};
