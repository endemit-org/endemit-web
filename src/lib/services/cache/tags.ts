/**
 * Cache Tag Builders
 *
 * Hierarchical cache tags for precise invalidation.
 * Convention: category:identifier:subcategory
 */

// ═══════════════════════════════════════════════════════════════
// USER-SPECIFIC TAGS
// ═══════════════════════════════════════════════════════════════

export const userTags = {
  /** All tickets for a user */
  tickets: (userId: string) => `user:${userId}:tickets` as const,

  /** Upcoming tickets only */
  ticketsUpcoming: (userId: string) => `user:${userId}:tickets:upcoming` as const,

  /** All orders for a user */
  orders: (userId: string) => `user:${userId}:orders` as const,

  /** Latest orders for profile overview */
  ordersLatest: (userId: string) => `user:${userId}:orders:latest` as const,

  /** Wallet balance (display only, not for validation) */
  wallet: (userId: string) => `user:${userId}:wallet` as const,

  /** All transactions for a user */
  transactions: (userId: string) => `user:${userId}:transactions` as const,

  /** Latest transactions for profile overview */
  transactionsLatest: (userId: string) =>
    `user:${userId}:transactions:latest` as const,

  /** Event claims */
  claims: (userId: string) => `user:${userId}:claims` as const,

  /** Approved event claims */
  claimsApproved: (userId: string) =>
    `user:${userId}:claims:approved` as const,

  /** Events attended (derived from tickets) */
  events: (userId: string) => `user:${userId}:events` as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// ADMIN TAGS - ORDERS & DONATIONS
// ═══════════════════════════════════════════════════════════════

export const adminOrderTags = {
  /** All orders list */
  list: () => "admin:orders" as const,

  /** Order statistics (revenue, counts) */
  stats: () => "admin:orders:stats" as const,

  /** All donations list */
  donations: () => "admin:donations" as const,

  /** Aggregated donors */
  donors: () => "admin:donors" as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// ADMIN TAGS - TICKETS & EVENTS
// ═══════════════════════════════════════════════════════════════

export const adminTicketTags = {
  /** All tickets list */
  list: () => "admin:tickets" as const,

  /** Tickets for a specific event */
  forEvent: (eventId: string) => `admin:tickets:event:${eventId}` as const,

  /** Ticket stats for a specific event */
  statsForEvent: (eventId: string) =>
    `admin:tickets:stats:${eventId}` as const,

  /** Ticket summary for a specific event */
  summaryForEvent: (eventId: string) =>
    `admin:tickets:summary:${eventId}` as const,

  /** Scanned tickets for a specific event */
  scannedForEvent: (eventId: string) =>
    `admin:tickets:scanned:${eventId}` as const,
} as const;

export const adminEventTags = {
  /** Events list for admin */
  list: () => "admin:events" as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// ADMIN TAGS - USERS & WALLETS
// ═══════════════════════════════════════════════════════════════

export const adminUserTags = {
  /** All users list */
  list: () => "admin:users" as const,

  /** User statistics */
  stats: () => "admin:users:stats" as const,
} as const;

export const adminWalletTags = {
  /** All wallets list */
  list: () => "admin:wallets" as const,

  /** Wallet statistics */
  stats: () => "admin:wallets:stats" as const,

  /** All transactions list */
  transactions: () => "admin:transactions" as const,

  /** Transaction statistics */
  transactionStats: () => "admin:transactions:stats" as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// ADMIN TAGS - POS
// ═══════════════════════════════════════════════════════════════

export const adminPosTags = {
  /** POS orders list */
  orders: () => "admin:pos:orders" as const,

  /** POS items list */
  items: () => "admin:pos:items" as const,

  /** POS registers list */
  registers: () => "admin:pos:registers" as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// ADMIN TAGS - ROLES & ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════

export const adminRoleTags = {
  /** All roles list */
  list: () => "admin:roles" as const,

  /** Role statistics */
  stats: () => "admin:roles:stats" as const,
} as const;

export const adminAnnouncementTags = {
  /** All announcements list */
  list: () => "admin:announcements" as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// SINGLE ITEM TAGS
// ═══════════════════════════════════════════════════════════════

export const itemTags = {
  /** Single order */
  order: (orderId: string) => `order:${orderId}` as const,

  /** Single ticket by ID */
  ticket: (ticketId: string) => `ticket:${ticketId}` as const,

  /** Single ticket by short ID */
  ticketShort: (shortId: string) => `ticket:short:${shortId}` as const,

  /** Single transaction */
  transaction: (transactionId: string) =>
    `transaction:${transactionId}` as const,

  /** Single wallet */
  wallet: (walletId: string) => `wallet:${walletId}` as const,

  /** Wallet transactions list (for caching by walletId) */
  walletTransactions: (walletId: string) =>
    `wallet:${walletId}:transactions` as const,

  /** Single user (admin view) */
  user: (userId: string) => `user:${userId}` as const,

  /** Single role */
  role: (roleId: string) => `role:${roleId}` as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// COMBINED EXPORT
// ═══════════════════════════════════════════════════════════════

export const CacheTags = {
  user: userTags,
  admin: {
    orders: adminOrderTags,
    tickets: adminTicketTags,
    events: adminEventTags,
    users: adminUserTags,
    wallets: adminWalletTags,
    pos: adminPosTags,
    roles: adminRoleTags,
    announcements: adminAnnouncementTags,
  },
  item: itemTags,
} as const;

// Type helpers for tag values
export type UserTag = ReturnType<(typeof userTags)[keyof typeof userTags]>;
export type AdminTag =
  | ReturnType<(typeof adminOrderTags)[keyof typeof adminOrderTags]>
  | ReturnType<(typeof adminTicketTags)[keyof typeof adminTicketTags]>
  | ReturnType<(typeof adminEventTags)[keyof typeof adminEventTags]>
  | ReturnType<(typeof adminUserTags)[keyof typeof adminUserTags]>
  | ReturnType<(typeof adminWalletTags)[keyof typeof adminWalletTags]>
  | ReturnType<(typeof adminPosTags)[keyof typeof adminPosTags]>
  | ReturnType<(typeof adminRoleTags)[keyof typeof adminRoleTags]>
  | ReturnType<(typeof adminAnnouncementTags)[keyof typeof adminAnnouncementTags]>;
export type ItemTag = ReturnType<(typeof itemTags)[keyof typeof itemTags]>;
export type CacheTag = UserTag | AdminTag | ItemTag;
