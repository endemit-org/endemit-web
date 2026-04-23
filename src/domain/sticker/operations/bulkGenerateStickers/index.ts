import "server-only";

import { prisma } from "@/lib/services/prisma";

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
}

export async function bulkGenerateStickers(
  count: number
): Promise<BulkGenerateStickersResult> {
  if (!Number.isFinite(count) || count <= 0) {
    throw new Error("count must be a positive integer");
  }
  if (count > 5000) {
    throw new Error("count cannot exceed 5000 per call");
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

  const result = await prisma.stickerCode.createMany({
    data: toCreate.map(code => ({ code })),
    skipDuplicates: true,
  });

  const total = await prisma.stickerCode.count();

  return {
    requested: count,
    created: result.count,
    totalInPool: total,
  };
}
