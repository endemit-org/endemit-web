import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureAllUsersHaveWallets() {
  console.log("Checking wallets for all users...\n");

  // Find all users without wallets
  const usersWithoutWallets = await prisma.user.findMany({
    where: {
      wallet: null,
    },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  console.log(`Found ${usersWithoutWallets.length} users without wallets.\n`);

  if (usersWithoutWallets.length === 0) {
    console.log("All users have wallets. Nothing to do.");
    return;
  }

  let createdCount = 0;

  for (const user of usersWithoutWallets) {
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    });
    console.log(`  + Created wallet for: ${user.email || user.username}`);
    createdCount++;
  }

  console.log("\n--- Summary ---");
  console.log(`Wallets created: ${createdCount}`);
  console.log("\nCompleted successfully!");
}

ensureAllUsersHaveWallets()
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
