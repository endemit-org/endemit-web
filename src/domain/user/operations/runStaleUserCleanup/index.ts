import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { bustOnUserCreated } from "@/lib/services/cache";

/** Accounts must be at least this old before cleanup considers them. */
const STALE_USER_AGE_DAYS = 30;

/** Per-run safety cap — a runaway query can never wipe more than this. */
const MAX_DELETIONS_PER_RUN = 500;

/**
 * Weekly cleanup of bot/abandoned accounts: users who requested a magic
 * link but never completed a login. Hard-deletes accounts that are ALL of:
 * - OTC sign-in with no password (password accounts are never touched,
 *   which also protects internal endemit+card accounts)
 * - never logged in, older than STALE_USER_AGE_DAYS
 * - no orders (tickets hang off orders), no POS orders as customer/seller
 * - wallet empty with no transactions (or no wallet at all)
 * - no linked wristband/sticker, no role beyond "user"
 * - not an import/card placeholder email (belt and braces)
 *
 * Relations are Cascade/SetNull, so deleteMany removes wallets, sessions
 * and OTC tokens with the user.
 */
export const runStaleUserCleanup = inngest.createFunction(
  {
    id: "stale-user-cleanup",
    retries: 1,
    triggers: [{ cron: "0 4 * * 1" }], // weekly, Monday 04:00 UTC
  },
  async ({ step }) => {
    return await step.run("delete-stale-users", async () => {
      const cutoff = new Date(
        Date.now() - STALE_USER_AGE_DAYS * 24 * 60 * 60 * 1000
      );

      const candidates = await prisma.user.findMany({
        where: {
          signInType: "OTC",
          passwordHash: null,
          lastLoginAt: null,
          createdAt: { lt: cutoff },
          orders: { none: {} },
          posOrdersAsCustomer: { none: {} },
          posOrdersAsSeller: { none: {} },
          stickerCode: { is: null },
          userRoles: { none: { role: { slug: { not: "user" } } } },
          OR: [
            { wallet: { is: null } },
            { wallet: { is: { balance: 0, transactions: { none: {} } } } },
          ],
          NOT: [
            { email: { endsWith: "@import.endemit.org" } },
            { email: { startsWith: "endemit+card." } },
          ],
        },
        select: { id: true, email: true },
        orderBy: { createdAt: "asc" },
        take: MAX_DELETIONS_PER_RUN,
      });

      if (candidates.length === 0) {
        return { deleted: 0 };
      }

      const result = await prisma.user.deleteMany({
        where: { id: { in: candidates.map(c => c.id) } },
      });

      await bustOnUserCreated();

      console.log(
        `[stale-user-cleanup] Deleted ${result.count} stale accounts`,
        candidates.map(c => c.email)
      );

      return { deleted: result.count };
    });
  }
);
