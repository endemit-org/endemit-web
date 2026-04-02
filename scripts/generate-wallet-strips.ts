/**
 * Script to generate Apple Wallet strip images for all events
 *
 * Usage:
 *   pnpm generate-strips          # Generate strips for all events
 *   pnpm generate-strips --force  # Force regenerate all strips
 *
 * This script:
 * 1. Fetches all events from Prismic
 * 2. Generates strip images (@3x, @2x, @1x) for each event
 * 3. Uploads them to Vercel Blob storage
 */

// Load .env file for local development (no-op if file doesn't exist)
import { config } from "dotenv";
config();

import * as prismic from "@prismicio/client";
import { put, list } from "@vercel/blob";
import { generateWalletStrip } from "@/domain/wallet-pass/operations/generateWalletStrip";
import type { EventDocument } from "@/prismicio-types";

const BLOB_PATH_PREFIX = "wallet-strips";

interface EventStripData {
  id: string;
  uid: string;
  name: string;
  promoImageUrl: string | null;
}

async function fetchAllEvents(): Promise<EventStripData[]> {
  const repositoryName = process.env.PRISMIC_REPOSITORY_NAME;
  const accessToken = process.env.PRISMIC_ACCESS_TOKEN;

  if (!repositoryName || !accessToken) {
    throw new Error(
      "Missing PRISMIC_REPOSITORY_NAME or PRISMIC_ACCESS_TOKEN environment variables"
    );
  }

  const client = prismic.createClient(repositoryName, { accessToken });

  const events = await client.getAllByType("event", {
    pageSize: 200,
  });

  return events.map((event: EventDocument) => ({
    id: event.id,
    uid: event.uid ?? event.id,
    name: event.data.title ?? "Untitled Event",
    promoImageUrl: event.data.promo_image?.url ?? null,
  }));
}

async function getExistingStrips(): Promise<Set<string>> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH_PREFIX });
    // Extract event IDs from paths like "wallet-strips/eventId/strip@3x.png"
    const eventIds = new Set<string>();
    for (const blob of blobs) {
      const match = blob.pathname.match(/wallet-strips\/([^/]+)\//);
      if (match) {
        eventIds.add(match[1]);
      }
    }
    return eventIds;
  } catch {
    console.log("Could not list existing blobs, will generate all");
    return new Set();
  }
}

async function uploadStrip(
  eventId: string,
  suffix: string,
  buffer: Buffer
): Promise<string> {
  const filename = `${BLOB_PATH_PREFIX}/${eventId}/strip${suffix}.png`;

  const blob = await put(filename, buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return blob.url;
}

async function processEvent(event: EventStripData): Promise<boolean> {
  if (!event.promoImageUrl) {
    console.log(`  ⚠ Skipping ${event.name} - no promo image`);
    return false;
  }

  try {
    console.log(`  Generating strips for: ${event.name}`);

    const strips = await generateWalletStrip({
      eventImageUrl: event.promoImageUrl,
    });

    // Upload all three sizes
    await Promise.all([
      uploadStrip(event.id, "@3x", strips["@3x"]),
      uploadStrip(event.id, "@2x", strips["@2x"]),
      uploadStrip(event.id, "", strips["@1x"]),
    ]);

    console.log(`  ✓ Uploaded strips for: ${event.name}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed for ${event.name}:`, error);
    return false;
  }
}

async function main() {
  const forceRegenerate = process.argv.includes("--force");

  console.log("🎫 Generating Apple Wallet strip images...\n");

  // Fetch all events
  console.log("Fetching events from Prismic...");
  const events = await fetchAllEvents();
  console.log(`Found ${events.length} events\n`);

  // Get existing strips (unless forcing regeneration)
  let existingStrips = new Set<string>();
  if (!forceRegenerate) {
    console.log("Checking existing strips...");
    existingStrips = await getExistingStrips();
    console.log(`Found ${existingStrips.size} events with existing strips\n`);
  }

  // Process events
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const event of events) {
    // Skip if already exists (unless forcing)
    if (!forceRegenerate && existingStrips.has(event.id)) {
      console.log(`  → Skipping ${event.name} (already exists)`);
      skipped++;
      continue;
    }

    const success = await processEvent(event);
    if (success) {
      generated++;
    } else {
      failed++;
    }
  }

  console.log("\n✅ Done!");
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
