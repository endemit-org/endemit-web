import { TicketCreationData, TicketQueueEvent } from "@/types/ticket";
import { inngest } from "@/app/services/inngest";

export const queueTicketIssueAutomation = async (data: TicketCreationData) => {
  return await inngest.send({
    name: TicketQueueEvent.CREATE_TICKET,
    data,
  });
};
