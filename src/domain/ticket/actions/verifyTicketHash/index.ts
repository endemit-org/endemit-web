import { TicketPayload } from "@/domain/ticket/types/ticket";
import crypto from "crypto";

export const verifyTicketHash = (
  storedHash: string,
  ticketPayload: TicketPayload
) => {
  const secret = process.env.TICKET_SECRET;
  const splitConfig = process.env.TICKET_VERIFICATION_HASH_SPLIT_CONFIG;

  if (!secret || !splitConfig)
    throw new Error("Missing security parameters on verifyTicketHash");

  const [frontChars, backChars] = splitConfig.split(",").map(Number);

  const saltFront = storedHash.slice(0, frontChars);
  const saltBack = storedHash.slice(-backChars);
  const ticketSalt = saltFront + saltBack;

  const newPayload = {
    ...ticketPayload,
    salt: ticketSalt,
  };

  const data = JSON.stringify(newPayload);
  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  const computedCombined = saltFront + computedHash + saltBack;

  return crypto.timingSafeEqual(
    Buffer.from(storedHash),
    Buffer.from(computedCombined)
  );
};
