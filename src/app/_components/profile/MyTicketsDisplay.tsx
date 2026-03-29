"use client";

import type { SerializedTicket } from "@/domain/ticket/types/ticket";
import TicketCard from "./TicketCard";

interface MyTicketsDisplayProps {
  tickets: SerializedTicket[];
}

export default function MyTicketsDisplay({ tickets }: MyTicketsDisplayProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-300 mb-2">
          No tickets yet
        </h3>
        <p className="text-neutral-500">
          When you purchase event tickets, they will appear here.
        </p>
      </div>
    );
  }

  // Group tickets by event
  const ticketsByEvent = tickets.reduce(
    (acc, ticket) => {
      const eventId = ticket.eventId;
      if (!acc[eventId]) {
        acc[eventId] = {
          eventName: ticket.eventName,
          tickets: [],
        };
      }
      acc[eventId].tickets.push(ticket);
      return acc;
    },
    {} as Record<string, { eventName: string; tickets: SerializedTicket[] }>
  );

  // Separate into active and past tickets based on status
  const activeTickets = tickets.filter(
    t => t.status === "VALIDATED" || t.status === "PENDING"
  );
  const pastTickets = tickets.filter(
    t => t.status !== "VALIDATED" && t.status !== "PENDING"
  );

  return (
    <div className="space-y-8">
      {activeTickets.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
            Active Tickets
          </h2>
          <div className="space-y-3">
            {activeTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </section>
      )}

      {pastTickets.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
            Past Tickets
          </h2>
          <div className="space-y-3">
            {pastTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
