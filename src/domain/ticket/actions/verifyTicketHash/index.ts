import { TicketPayload } from "@/types/ticket";
import { generateSecureHash } from "@/domain/ticket/actions";
import crypto from "crypto";

export const verifyTicketHash = (
  ticketHash: string,
  ticketPayload: TicketPayload
) => {
  const expectedHash = generateSecureHash(ticketPayload);
  return crypto.timingSafeEqual(
    Buffer.from(ticketHash),
    Buffer.from(expectedHash)
  );
};
