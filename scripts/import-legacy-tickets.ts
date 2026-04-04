/**
 * Script to import legacy tickets into the database
 *
 * Usage:
 *   npx tsx scripts/import-legacy-tickets.ts              # Dry run (preview)
 *   npx tsx scripts/import-legacy-tickets.ts --execute    # Actually import
 *   npx tsx scripts/import-legacy-tickets.ts --limit=2    # Only process 2 users
 *   npx tsx scripts/import-legacy-tickets.ts --execute --limit=1  # Import 1 user
 *
 * This script:
 * 1. Creates users if they don't exist (with OTC sign-in, wallet, user role)
 * 2. Creates one order per ticket
 * 3. Creates tickets with proper hashes and QR content
 * 4. Does NOT send any emails or notifications
 */

import { config } from "dotenv";
config();

import { PrismaClient, OrderStatus, TicketStatus } from "@prisma/client";
import crypto from "crypto";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();

// Environment variables
const TICKET_SECRET = process.env.TICKET_SECRET;
const TICKET_VERIFICATION_HASH_SPLIT_CONFIG =
  process.env.TICKET_VERIFICATION_HASH_SPLIT_CONFIG || "8,8";

if (!TICKET_SECRET) {
  throw new Error("Missing TICKET_SECRET environment variable");
}

// Input data types
interface LegacyTicket {
  name: string;
  price: number;
  date: string;
  event: string;
  eventId: string;
}

interface LegacyUserData {
  email: string;
  tickets: LegacyTicket[];
}

// =============================================================================
// DATA - Replace this with your actual data or load from JSON file
// =============================================================================
const LEGACY_DATA: LegacyUserData[] = [];

// =============================================================================
// Utility Functions
// =============================================================================

function normaliseJsonInput(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = obj[key];
  }
  return result;
}

interface TicketPayload {
  eventId: string;
  eventName: string;
  ticketHolderName: string;
  ticketPayerEmail: string;
  orderId: string;
  price: number;
  shortId: string;
}

function generateSecureHash(ticketPayload: TicketPayload): string {
  const secret = TICKET_SECRET!;
  const splitConfig = TICKET_VERIFICATION_HASH_SPLIT_CONFIG;

  const ticketSalt = crypto.randomBytes(32).toString("hex");

  const newPayload = {
    ...ticketPayload,
    salt: ticketSalt,
  };

  const normalisedJsonInput = normaliseJsonInput(newPayload);
  const data = JSON.stringify(normalisedJsonInput);
  const hash = crypto.createHmac("sha256", secret).update(data).digest("hex");

  const [frontChars, backChars] = splitConfig.split(",").map(Number);
  const saltFront = ticketSalt.slice(0, frontChars);
  const saltBack = ticketSalt.slice(-backChars);

  return saltFront + hash + saltBack;
}

async function generateShortId(maxRetries = 10): Promise<string> {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);

  for (let i = 0; i < maxRetries; i++) {
    const generatedId = nanoid();
    const existing = await prisma.ticket.findUnique({
      where: { shortId: generatedId },
    });
    if (!existing) return generatedId;
  }

  throw new Error(`Failed to generate unique ID after ${maxRetries} attempts`);
}

function transformToQrContent(
  ticketHash: string,
  ticketPayload: TicketPayload
) {
  return {
    hash: ticketHash,
    ...ticketPayload,
  };
}

function parseDate(dateStr: string): Date {
  // Format: "YYYY-MM-DD HH:mm:ss"
  return new Date(dateStr.replace(" ", "T") + "Z");
}

// =============================================================================
// Main Import Logic
// =============================================================================

interface ImportStats {
  usersCreated: number;
  usersExisting: number;
  ordersCreated: number;
  ticketsCreated: number;
  ticketsSkipped: number;
  errors: string[];
}

async function findOrCreateUser(
  email: string,
  dryRun: boolean
): Promise<{ userId: string; isNew: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    return { userId: existingUser.id, isNew: false };
  }

  if (dryRun) {
    return { userId: `dry-run-user-${normalizedEmail}`, isNew: true };
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      username: normalizedEmail,
      email: normalizedEmail,
      signInType: "OTC",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
    select: { id: true },
  });

  // Assign user role
  const userRole = await prisma.role.findUnique({
    where: { slug: "user" },
  });

  if (userRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: userRole.id,
      },
    });
  }

  // Create wallet
  await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: 0,
    },
  });

  return { userId: user.id, isNew: true };
}

async function checkDuplicateTicket(
  email: string,
  eventId: string,
  ticketHolderName: string
): Promise<boolean> {
  const existing = await prisma.ticket.findFirst({
    where: {
      ticketPayerEmail: email.toLowerCase().trim(),
      eventId,
      ticketHolderName,
    },
  });
  return !!existing;
}

async function importLegacyTickets(
  dryRun: boolean,
  limit?: number
): Promise<ImportStats> {
  const stats: ImportStats = {
    usersCreated: 0,
    usersExisting: 0,
    ordersCreated: 0,
    ticketsCreated: 0,
    ticketsSkipped: 0,
    errors: [],
  };

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    dryRun
      ? "🔍 DRY RUN MODE - No changes will be made"
      : "🚀 EXECUTE MODE - Changes will be written"
  );
  console.log(`${"=".repeat(60)}\n`);

  const dataToProcess = limit ? LEGACY_DATA.slice(0, limit) : LEGACY_DATA;
  let globalTicketIndex = 0;

  for (const userData of dataToProcess) {
    const email = userData.email.toLowerCase().trim();
    console.log(`\n📧 Processing: ${email}`);

    try {
      // Find or create user
      const { userId, isNew } = await findOrCreateUser(email, dryRun);
      if (isNew) {
        stats.usersCreated++;
        console.log(`  ✓ Created new user: ${userId}`);
      } else {
        stats.usersExisting++;
        console.log(`  → User already exists: ${userId}`);
      }

      // Process each ticket
      for (const ticket of userData.tickets) {
        globalTicketIndex++;
        const ticketDate = parseDate(ticket.date);

        // Check for duplicates
        const isDuplicate = await checkDuplicateTicket(
          email,
          ticket.eventId,
          ticket.name
        );

        if (isDuplicate) {
          console.log(
            `  ⚠ Skipping duplicate: ${ticket.name} @ ${ticket.event}`
          );
          stats.ticketsSkipped++;
          continue;
        }

        if (dryRun) {
          console.log(
            `  📝 Would create ticket: ${ticket.name} @ ${ticket.event} (${ticket.price}€)`
          );
          stats.ordersCreated++;
          stats.ticketsCreated++;
          continue;
        }

        // Generate unique IDs
        const stripeSession = `legacy_import_${Date.now()}_${globalTicketIndex}`;
        const shortId = await generateShortId();

        // Create order
        const order = await prisma.order.create({
          data: {
            stripeSession,
            userId,
            name: ticket.name,
            email,
            subtotal: ticket.price,
            totalAmount: ticket.price,
            shippingAmount: 0,
            discountAmount: 0,
            walletAmountUsed: 0,
            shippingRequired: false,
            shippingAddress: null,
            items: [
              {
                id: `legacy_ticket_${globalTicketIndex}`,
                name: `${ticket.event} Ticket`,
                price: ticket.price,
                quantity: 1,
                category: "TICKETS",
                type: "DIGITAL",
              },
            ],
            metadata: { legacyImport: true, originalDate: ticket.date },
            status: OrderStatus.COMPLETED,
            createdAt: ticketDate,
            updatedAt: ticketDate,
          },
        });

        stats.ordersCreated++;

        // Generate ticket security data
        const ticketPayload: TicketPayload = {
          eventId: ticket.eventId,
          eventName: ticket.event,
          ticketHolderName: ticket.name,
          ticketPayerEmail: email,
          orderId: order.id,
          price: ticket.price,
          shortId,
        };

        const ticketHash = generateSecureHash(ticketPayload);
        const qrContent = transformToQrContent(ticketHash, ticketPayload);

        // Create ticket with SCANNED status (past event)
        const createdTicket = await prisma.ticket.create({
          data: {
            shortId,
            orderId: order.id,
            eventId: ticket.eventId,
            eventName: ticket.event,
            ticketHolderName: ticket.name,
            ticketPayerEmail: email,
            ticketHash,
            price: ticket.price,
            qrContent,
            scanCount: 1,
            attended: true,
            metadata: { legacyImport: true, originalDate: ticket.date },
            status: TicketStatus.SCANNED,
            createdAt: ticketDate,
            updatedAt: ticketDate,
          },
        });

        // Create ScanLog entry (event date at 23:00)
        const scanDate = new Date(ticketDate);
        scanDate.setHours(23, 0, 0, 0);

        await prisma.scanLog.create({
          data: {
            userId,
            ticketId: createdTicket.id,
            eventId: ticket.eventId,
            createdAt: scanDate,
            updatedAt: scanDate,
          },
        });

        stats.ticketsCreated++;
        console.log(
          `  ✓ Created ticket: ${shortId} - ${ticket.name} @ ${ticket.event}`
        );
      }
    } catch (error) {
      const errorMsg = `Error processing ${email}: ${error}`;
      console.error(`  ✗ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  return stats;
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
  const dryRun = !process.argv.includes("--execute");

  // Parse --limit=N parameter
  const limitArg = process.argv.find(arg => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

  const usersToProcess = limit
    ? Math.min(limit, LEGACY_DATA.length)
    : LEGACY_DATA.length;
  const ticketsToProcess = (
    limit ? LEGACY_DATA.slice(0, limit) : LEGACY_DATA
  ).reduce((sum, u) => sum + u.tickets.length, 0);

  console.log("🎫 Legacy Tickets Import Script");
  console.log(`   Total users in data:    ${LEGACY_DATA.length}`);
  console.log(
    `   Users to process:       ${usersToProcess}${limit ? ` (limited)` : ""}`
  );
  console.log(`   Tickets to import:      ${ticketsToProcess}`);

  try {
    const stats = await importLegacyTickets(dryRun, limit);

    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 IMPORT SUMMARY");
    console.log(`${"=".repeat(60)}`);
    console.log(`   Users created:    ${stats.usersCreated}`);
    console.log(`   Users existing:   ${stats.usersExisting}`);
    console.log(`   Orders created:   ${stats.ordersCreated}`);
    console.log(`   Tickets created:  ${stats.ticketsCreated}`);
    console.log(`   Tickets skipped:  ${stats.ticketsSkipped}`);
    console.log(`   Errors:           ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      for (const err of stats.errors) {
        console.log(`   - ${err}`);
      }
    }

    if (dryRun) {
      console.log(
        "\n💡 This was a dry run. Run with --execute to actually import."
      );
    } else {
      console.log("\n✅ Import completed successfully!");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
