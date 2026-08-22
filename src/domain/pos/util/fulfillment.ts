import "server-only";

import type { Prisma } from "@prisma/client";

/**
 * Start of "today" in the venue timezone (Europe/Ljubljana) — queue numbers
 * reset at local midnight, not UTC.
 */
export function startOfVenueDay(now = new Date()): Date {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Ljubljana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // CET/CEST only — pick the offset that round-trips to local midnight
  for (const offset of ["+02:00", "+01:00"]) {
    const candidate = new Date(`${dateStr}T00:00:00${offset}`);
    const hour = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Ljubljana",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(candidate);
    if (hour === "00") return candidate;
  }
  return new Date(`${dateStr}T00:00:00+01:00`);
}

/**
 * Next daily queue number for a register. Locks the register row so two
 * concurrent payments can't get the same number.
 */
export async function nextQueueNumber(
  tx: Prisma.TransactionClient,
  registerId: string
): Promise<number> {
  await tx.$executeRaw`SELECT id FROM "PosRegister" WHERE id = ${registerId} FOR UPDATE`;
  const result = await tx.posOrder.aggregate({
    _max: { queueNumber: true },
    where: {
      registerId,
      queueNumber: { not: null },
      paidAt: { gte: startOfVenueDay() },
    },
  });
  return (result._max.queueNumber ?? 0) + 1;
}
