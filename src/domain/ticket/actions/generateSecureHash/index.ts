import { TicketPayload } from "@/types/ticket";
import crypto from "crypto";

export const generateSecureHash = (ticketPayload: TicketPayload) => {
  const secret = process.env.TICKET_SECRET;
  if (!secret) throw new Error("TICKET_SECRET is not set");

  const data = JSON.stringify(ticketPayload);

  return crypto.createHmac("sha256", secret).update(data).digest("hex");
};
