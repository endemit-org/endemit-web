import "server-only";

import { revalidateTag } from "next/cache";
import {
  userTags,
  adminOrderTags,
  adminTicketTags,
  adminUserTags,
  adminWalletTags,
  adminPosTags,
  adminRoleTags,
  adminAnnouncementTags,
  adminEventTags,
  itemTags,
  type CacheTag,
} from "./tags";

/** Helper to bust multiple tags */
async function bustTags(tags: CacheTag[]) {
  await Promise.all(tags.map(tag => revalidateTag(tag)));
}

/**
 * Cache Busting Functions
 *
 * Each function busts all relevant cache tags for a specific mutation.
 * Call these after any data mutation to ensure cache consistency.
 */

// ═══════════════════════════════════════════════════════════════
// ORDER CACHE BUSTING
// ═══════════════════════════════════════════════════════════════

/**
 * Bust caches when a new order is created
 */
export async function bustOnOrderCreated(
  orderId: string,
  userId: string | null
) {
  const tags: CacheTag[] = [
    itemTags.order(orderId),
    adminOrderTags.list(),
    adminOrderTags.stats(),
  ];

  if (userId) {
    tags.push(userTags.orders(userId), userTags.ordersLatest(userId));
  }

  await bustTags(tags);
}

/**
 * Bust caches when order status changes
 */
export async function bustOnOrderStatusChanged(
  orderId: string,
  userId: string | null
) {
  const tags: CacheTag[] = [itemTags.order(orderId), adminOrderTags.list()];

  if (userId) {
    tags.push(userTags.orders(userId), userTags.ordersLatest(userId));
  }

  await bustTags(tags);
}

/**
 * Bust caches when order is refunded
 */
export async function bustOnOrderRefunded(
  orderId: string,
  userId: string | null
) {
  const tags: CacheTag[] = [
    itemTags.order(orderId),
    adminOrderTags.list(),
    adminOrderTags.stats(),
    adminWalletTags.stats(),
  ];

  if (userId) {
    tags.push(
      userTags.orders(userId),
      userTags.ordersLatest(userId),
      userTags.wallet(userId),
      userTags.transactions(userId),
      userTags.transactionsLatest(userId)
    );
  }

  await bustTags(tags);
}

/**
 * Bust caches when order contains donation
 */
export async function bustOnDonationReceived() {
  const tags: CacheTag[] = [
    adminOrderTags.donations(),
    adminOrderTags.donors(),
    adminOrderTags.stats(),
  ];

  await bustTags(tags);
}

// ═══════════════════════════════════════════════════════════════
// TICKET CACHE BUSTING
// ═══════════════════════════════════════════════════════════════

/**
 * Bust caches when ticket is issued
 */
export async function bustOnTicketIssued(
  ticketId: string,
  userId: string | null,
  eventId: string
) {
  const tags: CacheTag[] = [
    itemTags.ticket(ticketId),
    adminTicketTags.list(),
    adminTicketTags.forEvent(eventId),
    adminTicketTags.statsForEvent(eventId),
    adminTicketTags.summaryForEvent(eventId),
  ];

  if (userId) {
    tags.push(
      userTags.tickets(userId),
      userTags.ticketsUpcoming(userId),
      userTags.events(userId)
    );
  }

  await bustTags(tags);
}

/**
 * Bust caches when ticket is scanned
 */
export async function bustOnTicketScanned(
  ticketId: string,
  shortId: string,
  eventId: string,
  userId: string | null
) {
  const tags: CacheTag[] = [
    itemTags.ticket(ticketId),
    itemTags.ticketShort(shortId),
    adminTicketTags.scannedForEvent(eventId),
  ];

  if (userId) {
    tags.push(userTags.tickets(userId), userTags.ticketsUpcoming(userId));
  }

  await bustTags(tags);
}

/**
 * Bust caches when ticket is transferred
 */
export async function bustOnTicketTransferred(
  ticketId: string,
  fromUserId: string,
  toUserId: string,
  eventId: string
) {
  const tags: CacheTag[] = [
    itemTags.ticket(ticketId),
    adminTicketTags.list(),
    adminTicketTags.forEvent(eventId),
    // From user
    userTags.tickets(fromUserId),
    userTags.ticketsUpcoming(fromUserId),
    userTags.events(fromUserId),
    // To user
    userTags.tickets(toUserId),
    userTags.ticketsUpcoming(toUserId),
    userTags.events(toUserId),
  ];

  await bustTags(tags);
}

// ═══════════════════════════════════════════════════════════════
// WALLET & TRANSACTION CACHE BUSTING
// ═══════════════════════════════════════════════════════════════

/**
 * Bust caches when wallet is created
 */
export async function bustOnWalletCreated(userId: string) {
  const tags: CacheTag[] = [
    userTags.wallet(userId),
    adminWalletTags.list(),
    adminWalletTags.stats(),
  ];

  await bustTags(tags);
}

/**
 * Bust caches when transaction is created (purchase, payment)
 */
export async function bustOnTransactionCreated(
  transactionId: string,
  userId: string,
  walletId: string
) {
  const tags: CacheTag[] = [
    itemTags.transaction(transactionId),
    itemTags.wallet(walletId),
    itemTags.walletTransactions(walletId),
    userTags.wallet(userId),
    userTags.transactions(userId),
    userTags.transactionsLatest(userId),
    adminWalletTags.transactions(),
    adminWalletTags.transactionStats(),
    adminWalletTags.stats(),
  ];

  await bustTags(tags);
}

/**
 * Bust caches when product rewards balance to wallet
 */
export async function bustOnBalanceRewarded(userId: string, walletId: string) {
  const tags: CacheTag[] = [
    itemTags.wallet(walletId),
    userTags.wallet(userId),
    userTags.transactions(userId),
    userTags.transactionsLatest(userId),
    adminWalletTags.stats(),
  ];

  await bustTags(tags);
}

/**
 * Bust caches when admin tops up or adjusts wallet
 */
export async function bustOnAdminWalletAdjustment(
  userId: string,
  walletId: string
) {
  const tags: CacheTag[] = [
    itemTags.wallet(walletId),
    userTags.wallet(userId),
    userTags.transactions(userId),
    userTags.transactionsLatest(userId),
    adminWalletTags.list(),
    adminWalletTags.stats(),
    adminWalletTags.transactions(),
  ];

  await bustTags(tags);
}

// ═══════════════════════════════════════════════════════════════
// USER CACHE BUSTING
// ═══════════════════════════════════════════════════════════════

/**
 * Bust caches when user is created
 */
export async function bustOnUserCreated() {
  const tags: CacheTag[] = [adminUserTags.list(), adminUserTags.stats()];

  await bustTags(tags);
}

/**
 * Bust caches when user is updated
 */
export async function bustOnUserUpdated(userId: string) {
  const tags: CacheTag[] = [itemTags.user(userId), adminUserTags.list()];

  await bustTags(tags);
}

/**
 * Bust caches when role is assigned to user
 */
export async function bustOnRoleAssigned(userId: string) {
  const tags: CacheTag[] = [itemTags.user(userId), adminRoleTags.stats()];

  await bustTags(tags);
}

// ═══════════════════════════════════════════════════════════════
// CLAIMS CACHE BUSTING
// ═══════════════════════════════════════════════════════════════

/**
 * Bust caches when event is claimed
 */
export async function bustOnEventClaimed(userId: string) {
  const tags: CacheTag[] = [userTags.claims(userId), adminEventTags.list()];

  await bustTags(tags);
}

/**
 * Bust caches when claim is approved
 */
export async function bustOnClaimApproved(userId: string) {
  const tags: CacheTag[] = [
    userTags.claims(userId),
    userTags.claimsApproved(userId),
    adminEventTags.list(),
  ];

  await bustTags(tags);
}

// ═══════════════════════════════════════════════════════════════
// POS CACHE BUSTING
// ═══════════════════════════════════════════════════════════════

/**
 * Bust caches when POS order is created
 */
export async function bustOnPosOrderCreated() {
  const tags: CacheTag[] = [adminPosTags.orders()];

  await bustTags(tags);
}

/**
 * Bust caches when POS order is paid
 */
export async function bustOnPosOrderPaid(userId: string) {
  const tags: CacheTag[] = [
    adminPosTags.orders(),
    userTags.wallet(userId),
    userTags.transactions(userId),
    userTags.transactionsLatest(userId),
  ];

  await bustTags(tags);
}

/**
 * Bust caches when POS top-up occurs
 */
export async function bustOnPosTopUp(userId: string) {
  const tags: CacheTag[] = [
    adminPosTags.orders(),
    adminWalletTags.stats(),
    userTags.wallet(userId),
    userTags.transactions(userId),
    userTags.transactionsLatest(userId),
  ];

  await bustTags(tags);
}

/**
 * Bust caches when POS item changes
 */
export async function bustOnPosItemChanged() {
  const tags: CacheTag[] = [adminPosTags.items()];

  await bustTags(tags);
}

/**
 * Bust caches when POS register changes
 */
export async function bustOnPosRegisterChanged() {
  const tags: CacheTag[] = [adminPosTags.registers()];

  await bustTags(tags);
}

// ═══════════════════════════════════════════════════════════════
// ROLES & ANNOUNCEMENTS CACHE BUSTING
// ═══════════════════════════════════════════════════════════════

/**
 * Bust caches when role changes
 */
export async function bustOnRoleChanged(roleId?: string) {
  const tags: CacheTag[] = [adminRoleTags.list(), adminRoleTags.stats()];

  if (roleId) {
    tags.push(itemTags.role(roleId));
  }

  await bustTags(tags);
}

/**
 * Bust caches when announcement changes
 */
export async function bustOnAnnouncementChanged() {
  const tags: CacheTag[] = [adminAnnouncementTags.list()];

  await bustTags(tags);
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: BUST ALL USER CACHES
// ═══════════════════════════════════════════════════════════════

/**
 * Bust all cached data for a specific user
 * Use sparingly - prefer specific bust functions
 */
export async function bustAllUserCaches(userId: string) {
  const tags: CacheTag[] = [
    userTags.tickets(userId),
    userTags.ticketsUpcoming(userId),
    userTags.orders(userId),
    userTags.ordersLatest(userId),
    userTags.wallet(userId),
    userTags.transactions(userId),
    userTags.transactionsLatest(userId),
    userTags.claims(userId),
    userTags.claimsApproved(userId),
    userTags.events(userId),
    itemTags.user(userId),
  ];

  await bustTags(tags);
}
