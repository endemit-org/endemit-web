import "server-only";

import { inngest } from "@/lib/services/inngest";
import {
  WalletQueueEvent,
  type P2PTransferNotificationData,
} from "@/domain/wallet/types";

export const queueP2PTransferEmail = async (
  data: P2PTransferNotificationData
) => {
  return await inngest.send({
    name: WalletQueueEvent.NOTIFY_P2P_TRANSFER,
    data,
  });
};
