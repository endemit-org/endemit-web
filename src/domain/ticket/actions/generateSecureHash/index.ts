import { TicketPayload } from "@/types/ticket";
import assert from "node:assert";
import crypto from "crypto";

export const generateSecureHash = (ticketPayload: TicketPayload) => {
  const secret = process.env.TICKET_SECRET;
  assert(secret, "TICKET_SECRET is not set");

  const data = JSON.stringify(ticketPayload);

  return crypto.createHmac("sha256", secret).update(data).digest("hex");
};
