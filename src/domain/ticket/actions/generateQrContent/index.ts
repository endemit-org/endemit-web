import { TicketPayload } from "@/domain/ticket/types/ticket";

export const generateQrContent = (
  ticketHash: string,
  ticketPayload: TicketPayload
) => {
  return JSON.stringify({
    hash: ticketHash,
    payload: ticketPayload,
  });
};
