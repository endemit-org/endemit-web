import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const NUMBERS = "0123456789";

function generateCode(): string {
  const l1 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const l2 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const n1 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const n2 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  return `${l1}${l2}${n1}${n2}`;
}

const DEFAULT_COUNT = 1000;

async function seedStickers() {
  const target = Number(process.argv[2] ?? DEFAULT_COUNT);
  if (!Number.isFinite(target) || target <= 0) {
    console.error(`Invalid count: ${process.argv[2]}`);
    process.exit(1);
  }

  const existingCount = await prisma.stickerCode.count();
  console.log(`Existing sticker codes: ${existingCount}`);
  console.log(`Target to add: ${target}\n`);

  const existingCodes = new Set(
    (
      await prisma.stickerCode.findMany({ select: { code: true } })
    ).map(s => s.code)
  );

  const toCreate: string[] = [];
  const MAX_ATTEMPTS = target * 20;
  let attempts = 0;

  while (toCreate.length < target && attempts < MAX_ATTEMPTS) {
    const code = generateCode();
    attempts++;
    if (existingCodes.has(code)) continue;
    existingCodes.add(code);
    toCreate.push(code);
  }

  if (toCreate.length < target) {
    console.error(
      `Could only generate ${toCreate.length} unique codes after ${attempts} attempts. Keyspace is ${LETTERS.length * LETTERS.length * 100} (~${LETTERS.length ** 2 * 100}).`
    );
  }

  const result = await prisma.stickerCode.createMany({
    data: toCreate.map(code => ({ code })),
    skipDuplicates: true,
  });

  console.log(`Created ${result.count} new sticker codes.`);
  const finalCount = await prisma.stickerCode.count();
  console.log(`Total sticker codes in DB: ${finalCount}`);
}

seedStickers()
  .catch(error => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
