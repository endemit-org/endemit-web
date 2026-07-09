import "server-only";

import { prisma } from "@/lib/services/prisma";

export interface TransferCounterparty {
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
}

const counterpartyUserSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
} as const;

const walletUserInclude = {
  wallet: {
    select: {
      user: { select: counterpartyUserSelect },
    },
  },
} as const;

/**
 * Distinct users this user has exchanged P2P transfers with, most recent
 * first — the "friends" quick-pick for sending tokens again.
 */
export async function getTransferCounterparties(
  userId: string,
  limit = 8
): Promise<TransferCounterparty[]> {
  const transactions = await prisma.walletTransaction.findMany({
    where: {
      wallet: { userId },
      type: "P2P_TRANSFER",
    },
    orderBy: { createdAt: "desc" },
    // Scan window: enough history to fill `limit` distinct counterparties
    // even when most recent transfers repeat the same few people.
    take: 100,
    include: {
      linkedFrom: { include: walletUserInclude },
      relatedTransaction: { include: walletUserInclude },
    },
  });

  const seen = new Set<string>();
  const counterparties: TransferCounterparty[] = [];
  for (const tx of transactions) {
    // Debit row: linkedFrom is the credit on the recipient's wallet.
    // Credit row: relatedTransaction is the debit on the sender's wallet.
    const user =
      tx.linkedFrom?.wallet.user ?? tx.relatedTransaction?.wallet.user ?? null;
    if (!user || user.id === userId || seen.has(user.id)) continue;
    seen.add(user.id);
    counterparties.push({
      userId: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
    });
    if (counterparties.length >= limit) break;
  }
  return counterparties;
}
