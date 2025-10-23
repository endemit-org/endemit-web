import { TicketPayload } from "@/domain/ticket/types/ticket";

export const transformToQrContent = (
  ticketHash: string,
  ticketPayload: TicketPayload
) => {
  return {
    hash: ticketHash,
    ...ticketPayload,
  };
};
