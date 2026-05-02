import "server-only";

import { prisma } from "@/lib/services/prisma";
import { resolveSticker } from "@/domain/sticker/operations/resolveSticker";
import {
  looksLikeReceiveCode,
  verifyReceiveCode,
} from "@/domain/wallet/util/receiveCode";

export interface TransferRecipient {
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
}

export async function resolveTransferRecipient(
  rawValue: string
): Promise<TransferRecipient> {
  const value = rawValue.trim();
  if (!value) throw new Error("No code provided");

  let userId: string;

  if (looksLikeReceiveCode(value)) {
    const verified = verifyReceiveCode(value);
    if (!verified) throw new Error("Invalid receive code");
    userId = verified;
  } else {
    const sticker = await resolveSticker(value);
    userId = sticker.userId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("Recipient not found");
  }

  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    image: user.image,
  };
}
