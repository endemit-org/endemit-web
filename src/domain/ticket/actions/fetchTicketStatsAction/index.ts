"use server";

import assert from "node:assert";
import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";
import { TicketStatus } from "@prisma/client";
import { CacheTags } from "@/lib/services/cache";

export interface TicketStats {
  eventId: string;
  total: number;
  sold: number;
  scanned: number;
  pending: number;
  validated: number;
  cancelled: number;
  refunded: number;
  revenue: number;
  guestList: number;
}

export async function fetchTicketStatsForEvent(
  eventId: string
): Promise<TicketStats> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.TICKETS_READ_ALL),
    "User not authorized to read tickets"
  );

  return fetchTicketStatsForEventCached(eventId);
}

export async function fetchTicketStatsForEvents(
  eventIds: string[]
): Promise<Record<string, TicketStats>> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.TICKETS_READ_ALL),
    "User not authorized to read tickets"
  );

  // Fetch each event's stats using cached function
  const results: Record<string, TicketStats> = {};
  await Promise.all(
    eventIds.map(async eventId => {
      results[eventId] = await fetchTicketStatsForEventCached(eventId);
    })
  );
  return results;
}

function createEmptyStats(eventId: string): TicketStats {
  return {
    eventId,
    total: 0,
    sold: 0,
    scanned: 0,
    pending: 0,
    validated: 0,
    cancelled: 0,
    refunded: 0,
    revenue: 0,
    guestList: 0,
  };
}

async function fetchTicketStatsForEventsUncached(
  eventIds: string[]
): Promise<Record<string, TicketStats>> {
  if (eventIds.length === 0) return {};

  // Single query: group by eventId, status, isGuestList with sum of price
  const [groupedStats, revenueStats] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["eventId", "status", "isGuestList"],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ["eventId"],
      where: {
        eventId: { in: eventIds },
        isGuestList: false,
        status: { not: TicketStatus.REFUNDED },
      },
      _sum: { price: true },
    }),
  ]);

  // Build revenue map
  const revenueMap = new Map<string, number>();
  for (const row of revenueStats) {
    revenueMap.set(row.eventId, Number(row._sum.price ?? 0));
  }

  // Initialize stats for all requested events
  const statsMap: Record<string, TicketStats> = {};
  for (const eventId of eventIds) {
    statsMap[eventId] = createEmptyStats(eventId);
  }

  // Process grouped results
  for (const row of groupedStats) {
    const stats = statsMap[row.eventId];
    if (!stats) continue;

    const count = row._count.id;

    // Count by status
    switch (row.status) {
      case TicketStatus.SCANNED:
        stats.scanned += count;
        break;
      case TicketStatus.PENDING:
        stats.pending += count;
        break;
      case TicketStatus.VALIDATED:
        stats.validated += count;
        break;
      case TicketStatus.CANCELLED:
        stats.cancelled += count;
        break;
      case TicketStatus.REFUNDED:
        stats.refunded += count;
        break;
    }

    // Total excludes refunded
    if (row.status !== TicketStatus.REFUNDED) {
      stats.total += count;
    }

    // Sold excludes guest list and refunded
    if (!row.isGuestList && row.status !== TicketStatus.REFUNDED) {
      stats.sold += count;
    }

    // Guest list count
    if (row.isGuestList) {
      stats.guestList += count;
    }
  }

  // Add revenue
  for (const eventId of eventIds) {
    statsMap[eventId].revenue = revenueMap.get(eventId) ?? 0;
  }

  return statsMap;
}

/**
 * Cached version of ticket stats for a single event
 */
function fetchTicketStatsForEventCached(eventId: string): Promise<TicketStats> {
  return unstable_cache(
    async () => {
      const results = await fetchTicketStatsForEventsUncached([eventId]);
      return results[eventId] ?? createEmptyStats(eventId);
    },
    ["ticket-stats-event", eventId],
    { tags: [CacheTags.admin.tickets.statsForEvent(eventId)] }
  )();
}
