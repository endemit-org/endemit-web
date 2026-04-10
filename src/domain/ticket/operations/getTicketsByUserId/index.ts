import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { prismicClient } from "@/lib/services/prismic";
import { serializeTicket } from "@/domain/ticket/util";
import type { SerializedTicket } from "@/domain/ticket/types/ticket";
import type { EventDocument } from "@/prismicio-types";
import { CacheTags } from "@/lib/services/cache";
import { FEAT_IGNORE_VISIBILITY } from "@/lib/services/env/private";

const MAX_TICKETS_PER_USER = 500;

interface GetTicketsByUserIdOptions {
  upcomingOnly?: boolean;
  pastOnly?: boolean;
  limit?: number;
}

const getTicketsByUserIdUncached = async (
  userId: string,
  options: GetTicketsByUserIdOptions = {}
): Promise<SerializedTicket[]> => {
  const { upcomingOnly = false, pastOnly = false, limit } = options;

  const tickets = await prisma.ticket.findMany({
    where: {
      order: {
        userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit ?? MAX_TICKETS_PER_USER,
  });

  if ((!upcomingOnly && !pastOnly) || tickets.length === 0) {
    return tickets.map(ticket => serializeTicket(ticket));
  }

  // Get unique event IDs
  const eventIds = [...new Set(tickets.map(t => t.eventId))];

  // Fetch events from CMS to get their dates
  const events = await prismicClient
    .getByIDs<EventDocument>(eventIds)
    .catch(() => ({ results: [] }));

  // Build map of event ID -> { endDate, isVisible }
  const now = new Date();
  const BUFFER_HOURS = 3;

  const eventDataMap = new Map<string, { endDate: Date | null; isVisible: boolean }>();
  for (const event of events.results) {
    const endDate = event.data.date_end
      ? new Date(event.data.date_end)
      : event.data.date_start
        ? new Date(event.data.date_start)
        : null;
    const isVisible =
      FEAT_IGNORE_VISIBILITY || event.data.visibility !== "Hidden";
    eventDataMap.set(event.id, { endDate, isVisible });
  }

  // Filter tickets based on event visibility and date
  const filteredTickets = tickets.filter(ticket => {
    const eventData = eventDataMap.get(ticket.eventId);

    // If event not found in CMS, include ticket (don't hide user's purchased tickets)
    if (!eventData) return true;

    // Filter out hidden events
    if (!eventData.isVisible) return false;

    if (upcomingOnly) {
      // Include if event hasn't ended yet + 3 hour buffer (or no date = include it)
      if (!eventData.endDate) return true;
      const cutoffDate = new Date(eventData.endDate.getTime() + BUFFER_HOURS * 60 * 60 * 1000);
      return cutoffDate >= now;
    }

    if (pastOnly) {
      // Include if event has ended (exclude if no date)
      return eventData.endDate && eventData.endDate < now;
    }

    return true;
  });

  // Sort by event date
  // Upcoming: ascending (soonest first)
  // Past: descending (most recent first)
  filteredTickets.sort((a, b) => {
    const dateA = eventDataMap.get(a.eventId)?.endDate;
    const dateB = eventDataMap.get(b.eventId)?.endDate;

    // Handle null dates - push them to the end
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    if (upcomingOnly) {
      // Ascending for upcoming (soonest first)
      return dateA.getTime() - dateB.getTime();
    } else {
      // Descending for past (most recent first)
      return dateB.getTime() - dateA.getTime();
    }
  });

  return filteredTickets.map(ticket => serializeTicket(ticket));
};

/**
 * Get tickets for a user (cached)
 * Uses different cache tags based on options:
 * - upcomingOnly: user:{id}:tickets:upcoming
 * - all others: user:{id}:tickets
 */
export const getTicketsByUserId = (
  userId: string,
  options: GetTicketsByUserIdOptions = {}
): Promise<SerializedTicket[]> => {
  const { upcomingOnly = false } = options;

  // Use different cache tags for upcoming vs all tickets
  const tags = upcomingOnly
    ? [CacheTags.user.ticketsUpcoming(userId)]
    : [CacheTags.user.tickets(userId)];

  const cacheKey = [
    "tickets-user",
    userId,
    String(upcomingOnly),
    String(options.pastOnly ?? false),
    String(options.limit ?? MAX_TICKETS_PER_USER),
  ];

  return unstable_cache(
    () => getTicketsByUserIdUncached(userId, options),
    cacheKey,
    { tags }
  )();
};
