import "server-only";

import { prisma } from "@/lib/services/prisma";
import { resolveScanTarget } from "@/domain/wallet/util/resolveScanTarget";

export interface TransferRecipient {
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
}

export async function resolveTransferRecipient(
  rawValue: string
): Promise<TransferRecipient> {
  const { userId } = await resolveScanTarget(rawValue);

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
