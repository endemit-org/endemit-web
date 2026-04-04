import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface ProductInOrder {
  type: string;
  [key: string]: unknown;
}

async function completeDigitalOrders() {
  console.log("Starting migration: Completing digital-only PAID orders...\n");

  // Find all PAID orders
  const paidOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PAID,
    },
    select: {
      id: true,
      email: true,
      items: true,
      createdAt: true,
    },
  });

  console.log(`Found ${paidOrders.length} orders with PAID status.\n`);

  let completedCount = 0;
  let skippedCount = 0;

  for (const order of paidOrders) {
    const items = order.items as unknown as ProductInOrder[];

    // Check if order has any physical items
    const hasPhysicalItems = items.some(item => item.type === "Physical");

    if (hasPhysicalItems) {
      console.log(`  - Skipping ${order.id.slice(0, 8)}... (${order.email}) - has physical items`);
      skippedCount++;
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED },
      });
      console.log(`  + Completed ${order.id.slice(0, 8)}... (${order.email}) - digital only`);
      completedCount++;
    }
  }

  console.log("\n--- Migration Summary ---");
  console.log(`Orders completed: ${completedCount}`);
  console.log(`Orders skipped (has physical): ${skippedCount}`);
  console.log("\nMigration completed successfully!");
}

completeDigitalOrders()
  .catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
