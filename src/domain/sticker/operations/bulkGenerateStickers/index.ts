import "server-only";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/services/prisma";
import { createPasswordHash } from "@/domain/auth/operations/createPasswordHash";
import type { StickerCodeProperty } from "@prisma/client";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const NUMBERS = "0123456789";

function generateCode(): string {
  const l1 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const l2 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const n1 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const n2 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  return `${l1}${l2}${n1}${n2}`;
}

export interface BulkGenerateStickersResult {
  requested: number;
  created: number;
  totalInPool: number;
  cardAccountsCreated?: number;
}

export async function bulkGenerateStickers(
  count: number,
  property?: StickerCodeProperty | null,
  /**
   * Also create a temporary card account per code — same convention as
   * scripts/import-card-accounts.ts: @CODE / endemit+card.CODE@endemit.org
   * with a wallet, the sticker pre-linked (claimed) to it.
   */
  createCardAccounts = false
): Promise<BulkGenerateStickersResult> {
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error("count must be a positive integer");
  }
  if (count > 5000) {
    throw new Error("count cannot exceed 5000 per call");
  }
  // Password hashing makes account creation slow — keep batches bounded
  if (createCardAccounts && count > 200) {
    throw new Error("count cannot exceed 200 when creating card accounts");
  }

  const existingCodes = new Set(
    (await prisma.stickerCode.findMany({ select: { code: true } })).map(
      s => s.code
    )
  );

  const toCreate: string[] = [];
  const maxAttempts = count * 20;
  let attempts = 0;

  while (toCreate.length < count && attempts < maxAttempts) {
    const code = generateCode();
    attempts++;
    if (existingCodes.has(code)) continue;
    existingCodes.add(code);
    toCreate.push(code);
  }

  let created = 0;
  let cardAccountsCreated = 0;

  if (!createCardAccounts) {
    const result = await prisma.stickerCode.createMany({
      data: toCreate.map(code => ({ code, property: property ?? null })),
      skipDuplicates: true,
    });
    created = result.count;
  } else {
    // Same convention as scripts/import-card-accounts.ts: the sticker is
    // pre-claimed by a temporary @CODE account with a zero-balance wallet.
    const now = new Date();
    for (const code of toCreate) {
      const username = `@${code}`;
      const email = `endemit+card.${code.toLowerCase()}@endemit.org`;

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
        select: { id: true },
      });
      if (existingUser) continue; // code collides with an existing account

      const passwordHash = await createPasswordHash(
        randomBytes(12).toString("base64url")
      );

      await prisma.$transaction(async tx => {
        const user = await tx.user.create({
          data: {
            username,
            name: `Card ${code}`,
            email,
            emailVerified: now,
            passwordHash,
            signInType: "PASSWORD",
            status: "ACTIVE",
            locale: "sl",
          },
          select: { id: true },
        });

        await tx.wallet.create({
          data: { userId: user.id, balance: 0 },
        });

        await tx.stickerCode.create({
          data: {
            code,
            property: property ?? null,
            userId: user.id,
            claimedAt: now,
          },
        });
      });

      created++;
      cardAccountsCreated++;
    }
  }

  const total = await prisma.stickerCode.count();

  return {
    requested: count,
    created,
    totalInPool: total,
    ...(createCardAccounts && { cardAccountsCreated }),
  };
}
