import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { WALLET_RECEIVE_SECRET } from "@/lib/services/env/private";

const PREFIX = "ndr1";

function hmac(payload: string): string {
  return createHmac("sha256", WALLET_RECEIVE_SECRET)
    .update(payload)
    .digest("base64url")
    .slice(0, 16);
}

export function signReceiveCode(userId: string): string {
  const sig = hmac(userId);
  return `${PREFIX}.${userId}.${sig}`;
}

export function verifyReceiveCode(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const parts = raw.trim().split(".");
  if (parts.length !== 3) return null;
  const [prefix, userId, sig] = parts;
  if (prefix !== PREFIX) return null;
  if (!userId || !sig) return null;

  const expected = hmac(userId);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  return userId;
}

export function looksLikeReceiveCode(raw: string): boolean {
  return raw.startsWith(`${PREFIX}.`);
}
