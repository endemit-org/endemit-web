import "server-only";

import { TicketPayload } from "@/domain/ticket/types/ticket";
import crypto from "crypto";
import {
  TICKET_SECRET,
  TICKET_VERIFICATION_HASH_SPLIT_CONFIG,
} from "@/lib/services/env/private";
import { normaliseJsonInput } from "@/domain/ticket/util";

export const generateSecureHash = (ticketPayload: TicketPayload) => {
  const secret = TICKET_SECRET;
  const splitConfig = TICKET_VERIFICATION_HASH_SPLIT_CONFIG;

  if (!secret || !splitConfig)
    throw new Error("Missing security parameters on generateSecureHash");

  const ticketSalt = crypto.randomBytes(32).toString("hex");

  const newPayload = {
    ...ticketPayload,
    salt: ticketSalt,
  };

  const normalisedJsonInput = normaliseJsonInput(newPayload);

  const data = JSON.stringify(normalisedJsonInput);
  const hash = crypto.createHmac("sha256", secret).update(data).digest("hex");

  const [frontChars, backChars] = splitConfig.split(",").map(Number);

  const saltFront = ticketSalt.slice(0, frontChars);
  const saltBack = ticketSalt.slice(-backChars);

  return saltFront + hash + saltBack;
};
