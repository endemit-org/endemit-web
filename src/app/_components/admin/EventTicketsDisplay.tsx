"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TicketsTable from "@/app/_components/table/TicketsTable";
import { formatNumber, formatPrice } from "@/lib/util/formatting";
import {
  isTicketPending,
  isTicketScanned,
} from "@/domain/ticket/businessLogic";
import { TicketStatus } from "@prisma/client";
import { fetchTicketsForEvent } from "@/domain/ticket/actions/getTicketsForEventAction";
import { convertSecondsToMs } from "@/lib/util/converters";
import { SerializedTicket } from "@/domain/ticket/types/ticket";
import AddGuestTicketForm from "@/app/_components/admin/AddGuestTicketForm";

interface EventTicketsDisplayProps {
  eventId: string;
  eventName: string;
  initialTickets: SerializedTicket[];
  shouldAutoRefresh?: boolean;
  refreshInterval?: number;
  canCreateTickets?: boolean;
}

export default function EventTicketsDisplay({
  eventId,
  eventName,
  initialTickets,
  shouldAutoRefresh = false,
  refreshInterval = 30,
  canCreateTickets = false,
}: EventTicketsDisplayProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshTickets = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const freshTickets = await fetchTicketsForEvent(eventId);
      setTickets(freshTickets);
    } finally {
      setIsRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!shouldAutoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      refreshTickets();
    }, convertSecondsToMs(refreshInterval));

    return () => clearInterval(interval);
  }, [refreshTickets, shouldAutoRefresh, refreshInterval]);

  const ticketsScanned = tickets.filter(ticket => isTicketScanned(ticket));
  const ticketsRemaining = tickets.filter(ticket => isTicketPending(ticket));
  const ticketsGuest = tickets.filter(ticket => ticket.isGuestList && ticket.status !== TicketStatus.REFUNDED);
  // Exclude refunded tickets from sold count and revenue (matching backend logic)
  const ticketsSold = tickets.filter(ticket => !ticket.isGuestList && ticket.status !== TicketStatus.REFUNDED);
  const ticketsSoldAmount = ticketsSold.length;
  const ticketsScannedAmount = ticketsScanned.length;
  const ticketsRemainingAmount = ticketsRemaining.length;
  const ticketsGuestAmount = ticketsGuest.length;
  // Total excludes refunded tickets
  const totalTickets = tickets.filter(ticket => ticket.status !== TicketStatus.REFUNDED).length;

  const ticketsAttendedRatio =
    totalTickets > 0 ? ticketsScannedAmount / totalTickets : 0;

  // Revenue only from sold tickets (not guest list)
  const totalRevenue = ticketsSold.reduce((sum, ticket) => sum + ticket.price, 0);

  const handleTicketDetails = (ticket: SerializedTicket) => {
    router.push(`/admin/tickets/${ticket.id}`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Revenue:{" "}
            <strong className="text-green-600 text-lg">
              {formatPrice(totalRevenue)}
            </strong>
          </div>
          <div className="text-sm text-gray-600">
            Sold: <strong className="text-gray-900">{ticketsSoldAmount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Scanned:{" "}
            <strong className="text-green-600">
              {ticketsScannedAmount}{" "}
              <span className="font-normal text-xs">
                ({formatNumber(ticketsAttendedRatio * 100)}%)
              </span>
            </strong>
          </div>
          <div className="text-sm text-gray-600">
            Pending: <strong className="text-blue-600">{ticketsRemainingAmount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Guest: <strong className="text-purple-600">{ticketsGuestAmount}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shouldAutoRefresh && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              Auto-refresh: {refreshInterval}s
            </span>
          )}
          <button
            onClick={refreshTickets}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {canCreateTickets && (
        <div className="mb-4">
          <AddGuestTicketForm
            eventId={eventId}
            eventName={eventName}
            onTicketAdded={refreshTickets}
          />
        </div>
      )}

      <div className="flex flex-col gap-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Pending Tickets ({ticketsRemainingAmount})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <TicketsTable
              tickets={ticketsRemaining}
              onRowClick={handleTicketDetails}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Scanned Tickets ({ticketsScannedAmount})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <TicketsTable
              tickets={ticketsScanned}
              onRowClick={handleTicketDetails}
            />
          </div>
        </div>
      </div>
    </>
  );
}
