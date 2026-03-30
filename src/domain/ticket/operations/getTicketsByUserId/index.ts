import "server-only";

import { prisma } from "@/lib/services/prisma";
import { prismicClient } from "@/lib/services/prismic";
import { serializeTicket } from "@/domain/ticket/util";
import type { SerializedTicket } from "@/domain/ticket/types/ticket";
import type { EventDocument } from "@/prismicio-types";

interface GetTicketsByUserIdOptions {
  upcomingOnly?: boolean;
}

export const getTicketsByUserId = async (
  userId: string,
  options: GetTicketsByUserIdOptions = {}
): Promise<SerializedTicket[]> => {
  const { upcomingOnly = false } = options;

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

  if (!upcomingOnly || tickets.length === 0) {
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
  const upcomingEventIds = new Set(
    events.results
      .filter(event => {
        const endDate = event.data.date_end
          ? new Date(event.data.date_end)
          : event.data.date_start
            ? new Date(event.data.date_start)
            : null;
        // Include if event hasn't ended yet (or no date = include it)
        return !endDate || endDate >= now;
      })
      .map(event => event.id)
  );

  // Filter tickets to only those for upcoming events
  const upcomingTickets = tickets.filter(ticket =>
    upcomingEventIds.has(ticket.eventId)
  );

  return upcomingTickets.map(ticket => serializeTicket(ticket));
};
