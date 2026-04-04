import "server-only";

import { prisma } from "@/lib/services/prisma";
import { prismicClient } from "@/lib/services/prismic";
import { serializeTicket } from "@/domain/ticket/util";
import type { SerializedTicket } from "@/domain/ticket/types/ticket";
import type { EventDocument } from "@/prismicio-types";

interface GetTicketsByUserIdOptions {
  upcomingOnly?: boolean;
  pastOnly?: boolean;
}

export const getTicketsByUserId = async (
  userId: string,
  options: GetTicketsByUserIdOptions = {}
): Promise<SerializedTicket[]> => {
  const { upcomingOnly = false, pastOnly = false } = options;

  const tickets = await prisma.ticket.findMany({
    where: {
      order: {
        userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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

  // Build map of event ID -> end date (or start date if no end)
  const now = new Date();
  const BUFFER_HOURS = 3;

  const eventDateMap = new Map<string, Date | null>();
  for (const event of events.results) {
    const endDate = event.data.date_end
      ? new Date(event.data.date_end)
      : event.data.date_start
        ? new Date(event.data.date_start)
        : null;
    eventDateMap.set(event.id, endDate);
  }

  // Filter tickets based on event date
  const filteredTickets = tickets.filter(ticket => {
    const eventDate = eventDateMap.get(ticket.eventId);

    if (upcomingOnly) {
      // Include if event hasn't ended yet + 3 hour buffer (or no date = include it)
      if (!eventDate) return true;
      const cutoffDate = new Date(eventDate.getTime() + BUFFER_HOURS * 60 * 60 * 1000);
      return cutoffDate >= now;
    }

    if (pastOnly) {
      // Include if event has ended (exclude if no date)
      return eventDate && eventDate < now;
    }

    return true;
  });

  // Sort by event date
  // Upcoming: ascending (soonest first)
  // Past: descending (most recent first)
  filteredTickets.sort((a, b) => {
    const dateA = eventDateMap.get(a.eventId);
    const dateB = eventDateMap.get(b.eventId);

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
