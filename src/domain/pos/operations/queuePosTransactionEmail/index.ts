import "server-only";

import { inngest } from "@/lib/services/inngest";
import {
  PosQueueEvent,
  PosTransactionNotificationData,
} from "@/domain/pos/types";

export const queuePosTransactionEmail = async (
  data: PosTransactionNotificationData
) => {
  return await inngest.send({
    name: PosQueueEvent.NOTIFY_ON_TRANSACTION,
    data,
  });
};
