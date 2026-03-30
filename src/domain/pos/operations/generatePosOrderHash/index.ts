import "server-only";

import crypto from "crypto";
import {
  POS_ORDER_SECRET,
  POS_ORDER_HASH_SPLIT_CONFIG,
} from "@/lib/services/env/private";
import type { PosOrderPayload } from "@/domain/pos/types";

function normaliseJsonInput(input: Record<string, unknown>): string {
  const sortedKeys = Object.keys(input).sort();
  const sortedObject: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObject[key] = input[key];
  }
  return JSON.stringify(sortedObject);
}

export function generatePosOrderHash(payload: PosOrderPayload): string {
  const secret = POS_ORDER_SECRET;
  const splitConfig = POS_ORDER_HASH_SPLIT_CONFIG;

  if (!secret || !splitConfig) {
    throw new Error("Missing POS security parameters");
  }

  const salt = crypto.randomBytes(32).toString("hex");

  const payloadWithSalt = {
    ...payload,
    salt,
  };

  const normalised = normaliseJsonInput(payloadWithSalt);
  const hash = crypto.createHmac("sha256", secret).update(normalised).digest("hex");

  const [frontChars, backChars] = splitConfig.split(",").map(Number);

  const saltFront = salt.slice(0, frontChars);
  const saltBack = salt.slice(-backChars);

  return saltFront + hash + saltBack;
}
