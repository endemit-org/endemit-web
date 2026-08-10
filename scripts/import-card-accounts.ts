/**
 * Script to create prefilled card/wristband accounts from a CSV file.
 *
 * Usage:
 *   npx tsx scripts/import-card-accounts.ts                 # Dry run (preview)
 *   npx tsx scripts/import-card-accounts.ts --execute       # Actually import
 *   npx tsx scripts/import-card-accounts.ts --limit=5       # Only process 5 rows
 *   npx tsx scripts/import-card-accounts.ts --file=other.csv
 *
 * CSV columns (header row required):
 *   QR code, User name, Password, Email, Username, #QRValue, UUID
 *   e.g. PE49, @PE49, HVL318, endemit+card.PE49@endemit.org, Card PE49, URL:..., <uuid>
 *
 * Per row this script:
 * 1. Creates the user (username "@PE49", name "Card PE49", PASSWORD sign-in,
 *    ACTIVE, email verified) with a scrypt password hash — same format as
 *    src/domain/auth/operations/createPasswordHash
 * 2. Assigns the "user" role
 * 3. Creates a wallet (balance 0)
 * 4. Creates the StickerCode row if missing (property Festival26Black) and
 *    links it to the user (claimedAt = now)
 *
 * Existing users / already-claimed stickers are skipped and reported.
 * The synthetic emails never receive mail — isBlockedEmail() filters them.
 */

import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { readFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

// Matches src/domain/auth/config/password.config.ts
const PASSWORD_SALT_LENGTH = 16;
const PASSWORD_KEY_LENGTH = 64;

const STICKER_PROPERTY = "Festival26Black" as const;

// =============================================================================
// Args
// =============================================================================

const args = process.argv.slice(2);
const isExecute = args.includes("--execute");
const limitArg = args.find(a => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
const fileArg = args.find(a => a.startsWith("--file="));
const csvPath = path.resolve(
  process.cwd(),
  fileArg ? fileArg.split("=")[1] : "combination_list.csv"
);

// =============================================================================
// CSV parsing
// =============================================================================

interface CardAccountRow {
  line: number;
  code: string; // PE49
  username: string; // @PE49
  password: string; // HVL318
  email: string; // endemit+card.PE49@endemit.org
  name: string; // Card PE49
}

function parseCsv(filePath: string): CardAccountRow[] {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name.toLowerCase());
  const idx = {
    code: col("QR code"),
    username: col("User name"),
    password: col("Password"),
    email: col("Email"),
    name: col("Username"),
  };
  for (const [key, i] of Object.entries(idx)) {
    if (i === -1) throw new Error(`Missing CSV column for "${key}"`);
  }

  return lines.slice(1).map((line, i) => {
    const cells = line.split(",").map(c => c.trim());
    return {
      line: i + 2,
      code: cells[idx.code],
      username: cells[idx.username],
      password: cells[idx.password],
      email: cells[idx.email].toLowerCase(),
      name: cells[idx.name],
    };
  });
}

// =============================================================================
// Password hashing — same format as createPasswordHash ({salt}.{derivedKey})
// =============================================================================

async function createPasswordHash(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_LENGTH).toString("hex");
  const derivedKey = (await scryptAsync(
    password,
    salt,
    PASSWORD_KEY_LENGTH
  )) as Buffer;
  return `${salt}.${derivedKey.toString("hex")}`;
}

// =============================================================================
// Import
// =============================================================================

interface RowResult {
  code: string;
  status: "created" | "skipped" | "conflict" | "error";
  detail: string;
}

async function processRow(
  row: CardAccountRow,
  userRoleId: string | null
): Promise<RowResult> {
  // Validate row
  if (!row.code || !row.username || !row.password || !row.email) {
    return {
      code: row.code || `line ${row.line}`,
      status: "error",
      detail: `line ${row.line}: missing required cell`,
    };
  }

  // Existing user by username or email → skip untouched
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username: row.username }, { email: row.email }] },
    select: { id: true, username: true, email: true },
  });
  if (existingUser) {
    return {
      code: row.code,
      status: "skipped",
      detail: `user already exists (${existingUser.username})`,
    };
  }

  // Sticker claimed by someone else → conflict, do not create the user
  const existingSticker = await prisma.stickerCode.findUnique({
    where: { code: row.code },
    select: { userId: true },
  });
  if (existingSticker?.userId) {
    return {
      code: row.code,
      status: "conflict",
      detail: `sticker already claimed by user ${existingSticker.userId}`,
    };
  }

  if (!isExecute) {
    return {
      code: row.code,
      status: "created",
      detail: `[dry-run] would create ${row.username} / ${row.email}, wallet, link sticker (${existingSticker ? "existing row" : "new row"})`,
    };
  }

  const passwordHash = await createPasswordHash(row.password);
  const now = new Date();

  await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        username: row.username,
        name: row.name || null,
        email: row.email,
        emailVerified: now,
        passwordHash,
        signInType: "PASSWORD",
        status: "ACTIVE",
        locale: "sl",
      },
      select: { id: true },
    });

    if (userRoleId) {
      await tx.userRole.create({
        data: { userId: user.id, roleId: userRoleId },
      });
    }

    // Wallet must exist before the sticker points at the account
    await tx.wallet.create({
      data: { userId: user.id, balance: 0 },
    });

    await tx.stickerCode.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        property: STICKER_PROPERTY,
        userId: user.id,
        claimedAt: now,
      },
      update: { userId: user.id, claimedAt: now },
    });
  });

  return {
    code: row.code,
    status: "created",
    detail: `${row.username} / ${row.email}, wallet + sticker linked`,
  };
}

async function main() {
  console.log(`Reading ${csvPath}`);
  const rows = parseCsv(csvPath).slice(
    0,
    Number.isFinite(limit) ? limit : undefined
  );
  console.log(
    `${rows.length} row(s) to process — ${isExecute ? "EXECUTE" : "DRY RUN (pass --execute to apply)"}\n`
  );

  const userRole = await prisma.role.findUnique({
    where: { slug: "user" },
    select: { id: true },
  });
  if (!userRole) {
    console.warn('⚠️  Role "user" not found — accounts will have no role.');
  }

  const results: RowResult[] = [];
  for (const row of rows) {
    try {
      const result = await processRow(row, userRole?.id ?? null);
      results.push(result);
      const icon =
        result.status === "created"
          ? "✅"
          : result.status === "skipped"
            ? "⏭️"
            : "❌";
      console.log(`${icon} ${result.code}: ${result.detail}`);
    } catch (error) {
      results.push({
        code: row.code,
        status: "error",
        detail: error instanceof Error ? error.message : String(error),
      });
      console.error(`❌ ${row.code}: ${error}`);
    }
  }

  const count = (status: RowResult["status"]) =>
    results.filter(r => r.status === status).length;
  console.log(
    `\nDone. ${isExecute ? "Created" : "Would create"}: ${count("created")}, skipped: ${count("skipped")}, conflicts: ${count("conflict")}, errors: ${count("error")}`
  );
  if (count("conflict") + count("error") > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch(error => {
    console.error("Fatal:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
