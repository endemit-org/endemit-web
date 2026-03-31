import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureUserHasWallet(userId: string): Promise<boolean> {
  const existingWallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (existingWallet) {
    return false; // Already has wallet
  }

  await prisma.wallet.create({
    data: {
      userId,
      balance: 0,
    },
  });

  return true; // Created new wallet
}

async function migrateOrdersToUsers() {
  console.log("Starting migration: Creating users from orders...\n");

  // Get the "user" role
  const userRole = await prisma.role.findUnique({
    where: { slug: "user" },
  });

  if (!userRole) {
    console.error(
      "Error: 'user' role not found in database. Please run seed first."
    );
    process.exit(1);
  }

  // Get all unique emails from orders that don't have a userId yet
  const ordersWithoutUser = await prisma.order.findMany({
    where: {
      userId: null,
    },
    select: {
      email: true,
    },
    distinct: ["email"],
  });

  const uniqueEmails = ordersWithoutUser.map(o => o.email.toLowerCase().trim());
  console.log(
    `Found ${uniqueEmails.length} unique emails in orders without linked users.\n`
  );

  let createdCount = 0;
  let existingCount = 0;
  let linkedOrdersCount = 0;
  let walletsCreatedCount = 0;

  for (const email of uniqueEmails) {
    // Check if user already exists with this email
    let user = await prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      console.log(`  - User already exists: ${email}`);
      existingCount++;
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          username: email,
          email: email,
          signInType: "OTC",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });
      console.log(`  + Created user: ${email}`);
      createdCount++;

      // Assign "user" role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        },
      });
      console.log(`    + Assigned 'user' role`);
    }

    // Ensure user has a wallet
    const walletCreated = await ensureUserHasWallet(user.id);
    if (walletCreated) {
      console.log(`    + Created wallet`);
      walletsCreatedCount++;
    }

    // Link all orders with this email to this user
    const updateResult = await prisma.order.updateMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        userId: null,
      },
      data: {
        userId: user.id,
      },
    });

    if (updateResult.count > 0) {
      console.log(`    + Linked ${updateResult.count} order(s) to user`);
      linkedOrdersCount += updateResult.count;
    }
  }

  console.log("\n--- Migration Summary ---");
  console.log(`Users created: ${createdCount}`);
  console.log(`Users already existed: ${existingCount}`);
  console.log(`Wallets created: ${walletsCreatedCount}`);
  console.log(`Orders linked to users: ${linkedOrdersCount}`);
  console.log("\nMigration completed successfully!");
}

migrateOrdersToUsers()
  .catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
