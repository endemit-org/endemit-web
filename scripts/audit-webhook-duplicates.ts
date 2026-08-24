/**
 * READ-ONLY audit for damage from duplicated Stripe webhook deliveries
 * (see runOrderPaymentProcessing). Finds:
 *  1. duplicate wallet transactions with the same order-derived note
 *  2. orders with more tickets than their items' ticketHolders imply
 *  3. discount codes whose usedCount exceeds their number of paid orders
 *
 * Run: npx tsx scripts/audit-webhook-duplicates.ts
 */
import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

type OrderItem = {
  quantity?: number;
  metadata?: { ticketHolders?: string[] };
};

async function main() {
  console.log("=== 1. Duplicate wallet transactions (same wallet+type+note) ===");
  const dupTx = await prisma.$queryRaw<
    Array<{
      walletId: string;
      type: string;
      note: string;
      count: bigint;
      total: bigint;
      first: Date;
      last: Date;
    }>
  >`
    SELECT "walletId", "type"::text as type, "note",
           COUNT(*) as count, SUM("amount") as total,
           MIN("createdAt") as first, MAX("createdAt") as last
    FROM "WalletTransaction"
    WHERE "note" LIKE 'Order #%'
       OR "note" LIKE 'Wallet top-up from Order #%'
       OR "note" LIKE 'Top up reward from Order #%'
    GROUP BY "walletId", "type", "note"
    HAVING COUNT(*) > 1
    ORDER BY MAX("createdAt") DESC
  `;
  if (dupTx.length === 0) console.log("none found ✔");
  for (const d of dupTx) {
    console.log(
      `${d.note} | wallet ${d.walletId} | ${d.type} x${d.count} | summed amount ${Number(d.total) / 100} EUR | ${d.first.toISOString()} → ${d.last.toISOString()}`
    );
  }

  console.log("\n=== 2. Orders with more tickets than expected ===");
  const ordersWithTickets = await prisma.order.findMany({
    where: { tickets: { some: {} } },
    select: {
      id: true,
      createdAt: true,
      status: true,
      items: true,
      _count: { select: { tickets: true } },
    },
  });
  let ticketIssues = 0;
  for (const o of ordersWithTickets) {
    const items = (o.items as OrderItem[] | null) ?? [];
    const expected = items.reduce(
      (sum, item) => sum + (item.metadata?.ticketHolders?.length ?? 0),
      0
    );
    // Orders whose items carry no ticketHolders metadata (guest/door-sale
    // flows) can't be judged this way — skip them.
    if (expected === 0) continue;
    if (o._count.tickets > expected) {
      ticketIssues++;
      console.log(
        `order ${o.id} (${o.status}, ${o.createdAt.toISOString()}): expected ${expected} tickets, has ${o._count.tickets}`
      );
    }
  }
  if (ticketIssues === 0) console.log("none found ✔");

  console.log("\n=== 3. Discount codes over-counted vs paid orders ===");
  const codes = await prisma.discountCode.findMany({
    where: { usedCount: { gt: 0 } },
    select: {
      id: true,
      code: true,
      usedCount: true,
      _count: {
        select: {
          orders: {
            where: {
              status: {
                in: [
                  OrderStatus.PAID,
                  OrderStatus.COMPLETED,
                  OrderStatus.PREPARING,
                  OrderStatus.IN_DELIVERY,
                  OrderStatus.REFUND_REQUESTED,
                  OrderStatus.PARTIALLY_REFUNDED,
                  OrderStatus.REFUNDED,
                ],
              },
            },
          },
        },
      },
    },
  });
  let codeIssues = 0;
  for (const c of codes) {
    if (c.usedCount > c._count.orders) {
      codeIssues++;
      console.log(
        `code ${c.code}: usedCount ${c.usedCount} but only ${c._count.orders} paid orders reference it`
      );
    }
  }
  if (codeIssues === 0) console.log("none found ✔");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
