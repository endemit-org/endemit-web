import "server-only";

import { inngest } from "@/lib/services/inngest";
import {
  EventClaimQueueEvent,
  EventClaimQueueData,
} from "@/domain/claim/types";

export const queueEventClaimProcessing = async (data: EventClaimQueueData) => {
  return await inngest.send({
    name: EventClaimQueueEvent.PROCESS_CLAIM,
    data,
  });
};
