import {
  TicketCreationData,
  TicketQueueEvent,
} from "@/domain/ticket/types/ticket";
import { inngest } from "@/services/inngest";

export const queueTicketIssueAutomation = async (data: TicketCreationData) => {
  return await inngest.send({
    name: TicketQueueEvent.CREATE_TICKET,
    data,
  });
};
