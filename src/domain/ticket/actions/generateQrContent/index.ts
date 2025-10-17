import { TicketPayload } from "@/domain/ticket/types/ticket";

export const generateQrContent = (
  ticketHash: string,
  ticketPayload: TicketPayload
) => {
  return {
    hash: ticketHash,
    ...ticketPayload,
  };
};
