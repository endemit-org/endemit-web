import "server-only";

import { inngest } from "@/lib/services/inngest";
import { OtcQueueEvent, OtcEmailQueueData } from "@/domain/auth/types";

export const queueOtcEmail = async (data: OtcEmailQueueData) => {
  return await inngest.send({
    name: OtcQueueEvent.SEND_OTC_EMAIL,
    data,
  });
};
