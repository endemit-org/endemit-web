import "server-only";

import { prisma } from "@/lib/services/prisma";

// Letters excluding I and O to avoid confusion with 1 and 0
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const NUMBERS = "0123456789";

// Format: two letters + two numbers (e.g., "AB12")
function generateCode(): string {
  const l1 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const l2 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const n1 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const n2 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  return `${l1}${l2}${n1}${n2}`;
}

export async function generatePosShortCode(): Promise<string> {
  let code = generateCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await prisma.posOrder.findUnique({
      where: { shortCode: code },
    });

    if (!existing) {
      return code;
    }

    code = generateCode();
    attempts++;
  }

  // If we've exhausted attempts, add an extra digit
  return code + NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
}
