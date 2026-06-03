import "server-only";

import { resolveSticker } from "@/domain/sticker/operations/resolveSticker";
import {
  looksLikeReceiveCode,
  verifyReceiveCode,
} from "@/domain/wallet/util/receiveCode";

// Single entry point for any scan that should identify a user wallet —
// accepts a signed receive code (ndr1.*), a wristband URL (/s/AB12),
// or a raw wristband code (AB12). Returns the resolved userId.
export async function resolveScanTarget(
  rawValue: string
): Promise<{ userId: string }> {
  const value = rawValue.trim();
  if (!value) throw new Error("No code provided");

  if (looksLikeReceiveCode(value)) {
    const userId = verifyReceiveCode(value);
    if (!userId) throw new Error("Invalid receive code");
    return { userId };
  }

  const sticker = await resolveSticker(value);
  return { userId: sticker.userId };
}
