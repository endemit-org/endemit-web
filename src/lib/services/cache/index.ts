/**
 * Cache Service
 *
 * Centralized caching with hierarchical tags and precise invalidation.
 *
 * @example
 * ```ts
 * // In an operation file:
 * import { CacheTags, createCachedFnWithArg } from "@/lib/services/cache";
 *
 * const getTicketsByUserIdUncached = async (userId: string) => {
 *   return prisma.ticket.findMany({ where: { order: { userId } } });
 * };
 *
 * export const getTicketsByUserId = createCachedFnWithArg(
 *   getTicketsByUserIdUncached,
 *   (userId) => ({ tags: [CacheTags.user.tickets(userId)] }),
 *   (userId) => ["tickets-user", userId]
 * );
 * ```
 *
 * @example
 * ```ts
 * // In a mutation:
 * import { bustOnTicketIssued } from "@/lib/services/cache";
 *
 * await createTicket({ ... });
 * await bustOnTicketIssued(ticketId, userId, eventId);
 * ```
 */

// Tag builders
export {
  CacheTags,
  userTags,
  adminOrderTags,
  adminTicketTags,
  adminEventTags,
  adminUserTags,
  adminWalletTags,
  adminPosTags,
  adminRoleTags,
  adminAnnouncementTags,
  itemTags,
  type CacheTag,
  type UserTag,
  type AdminTag,
  type ItemTag,
} from "./tags";

// Bust functions
export {
  // Orders
  bustOnOrderCreated,
  bustOnOrderStatusChanged,
  bustOnOrderRefunded,
  bustOnDonationReceived,
  // Tickets
  bustOnTicketIssued,
  bustOnTicketScanned,
  bustOnTicketScanReverted,
  bustOnTicketTransferred,
  // Wallet & Transactions
  bustOnWalletCreated,
  bustOnTransactionCreated,
  bustOnBalanceRewarded,
  bustOnAdminWalletAdjustment,
  // Users
  bustOnUserCreated,
  bustOnUserUpdated,
  bustOnRoleAssigned,
  // Claims
  bustOnEventClaimed,
  bustOnClaimApproved,
  // POS
  bustOnPosOrderCreated,
  bustOnPosOrderPaid,
  bustOnPosTopUp,
  bustOnPosItemChanged,
  bustOnPosRegisterChanged,
  // Roles & Announcements
  bustOnRoleChanged,
  bustOnAnnouncementChanged,
  // Utility
  bustAllUserCaches,
} from "./bust";

// Cache wrappers
export {
  withCache,
  createCachedFn,
  createCachedFnWithArg,
  createCachedFnWithArgs2,
  createCachedFnWithOptions,
} from "./wrap";
