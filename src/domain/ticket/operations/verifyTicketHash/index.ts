import "server-only";

import { QrTicketPayload } from "@/domain/ticket/types/ticket";
import crypto from "crypto";
import {
  TICKET_SECRET,
  TICKET_VERIFICATION_HASH_SPLIT_CONFIG,
} from "@/lib/services/env/private";
import { normaliseJsonInput } from "@/domain/ticket/util";

export const verifyTicketHash = (qrTicketPayload: QrTicketPayload) => {
  const secret = TICKET_SECRET;
  const splitConfig = TICKET_VERIFICATION_HASH_SPLIT_CONFIG;

  if (!secret || !splitConfig)
    throw new Error("Missing security parameters on verifyTicketHash");

  const { hash, ...ticketPayload } = qrTicketPayload;

  const [frontChars, backChars] = splitConfig.split(",").map(Number);

  const saltFront = hash.slice(0, frontChars);
  const saltBack = hash.slice(-backChars);
  const ticketSalt = saltFront + saltBack;

  const newPayload = {
    ...ticketPayload,
    salt: ticketSalt,
  };

  const normalisedJsonInput = normaliseJsonInput(newPayload);

  const data = JSON.stringify(normalisedJsonInput);

  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  const computedCombined = saltFront + computedHash + saltBack;

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(computedCombined)
  );
};
