import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { SerializedWallet } from "@/domain/wallet/types";

export const createWallet = async (userId: string): Promise<SerializedWallet> => {
  const wallet = await prisma.wallet.create({
    data: {
      userId,
      balance: 0,
    },
  });

  return {
    id: wallet.id,
    userId: wallet.userId,
    balance: wallet.balance,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  };
};
