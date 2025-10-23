import "server-only";

import { inngest } from "@/lib/services/inngest";
import {
  OrderNotificationData,
  OrderQueueEvent,
} from "@/domain/order/types/order";

export const queueNewOrderAutomation = async (data: OrderNotificationData) => {
  return await inngest.send({
    name: OrderQueueEvent.NOTIFY_ON_ORDER,
    data,
  });
};
