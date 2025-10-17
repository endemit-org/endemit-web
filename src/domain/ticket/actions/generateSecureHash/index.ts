import { TicketPayload } from "@/domain/ticket/types/ticket";
import crypto from "crypto";

export const generateSecureHash = (ticketPayload: TicketPayload) => {
  const secret = process.env.TICKET_SECRET;
  const splitConfig = process.env.TICKET_VERIFICATION_HASH_SPLIT_CONFIG;

  if (!secret || !splitConfig)
    throw new Error("Missing security parameters on generateSecureHash");

  const ticketSalt = crypto.randomBytes(32).toString("hex");

  const newPayload = {
    ...ticketPayload,
    salt: ticketSalt,
  };

  const data = JSON.stringify(newPayload);
  const hash = crypto.createHmac("sha256", secret).update(data).digest("hex");

  const [frontChars, backChars] = splitConfig.split(",").map(Number);

  const saltFront = ticketSalt.slice(0, frontChars);
  const saltBack = ticketSalt.slice(-backChars);

  const combinedHash = saltFront + hash + saltBack;

  return combinedHash;
};
