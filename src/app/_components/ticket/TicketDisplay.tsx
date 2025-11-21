"use client";

import { useEffect, useState, useCallback } from "react";
import TicketsTable from "@/app/_components/table/TicketsTable";
import { formatNumber } from "@/lib/util/formatting";
import {
  isTicketPending,
  isTicketScanned,
} from "@/domain/ticket/businessLogic";
import { fetchTicketsForEvent } from "@/domain/ticket/actions/getTicketsForEventAction";
import { convertSecondsToMs } from "@/lib/util/converters";
import ActionButton from "@/app/_components/form/ActionButton";
import { SerializedTicket } from "@/domain/ticket/types/ticket";
import TicketDetailsDialog from "@/app/_components/ticket/TicketDetailsDialog";
import { scanTicketAtEventAction } from "@/domain/ticket/actions/scanTicketAtEventAction";

const ALREADY_SCANNED_MESSAGE = "This ticket has already been scanned.";
const GENERIC_SCAN_ERROR = "Ticket could not be scanned.";

interface TicketsDisplayProps {
  eventId: string;
  initialTickets: SerializedTicket[];
  shouldAutoRefresh?: boolean;
  refreshInterval?: number;
  scanningEnabled: boolean;
}

export default function TicketsDisplay({
  eventId,
  initialTickets,
  shouldAutoRefresh = false,
  refreshInterval = 10,
  scanningEnabled,
}: TicketsDisplayProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SerializedTicket | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

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
  const ticketsSoldAmount = tickets.length ?? 0;
  const ticketsScannedAmount = ticketsScanned.length;
  const ticketsRemainingAmount = ticketsRemaining.length;

  const ticketsAttendedRatio =
    ticketsSoldAmount > 0 ? ticketsScannedAmount / ticketsSoldAmount : 0;

  const handleTicketDetails = (ticket: SerializedTicket) => {
    setSelectedTicket(ticket);
    setDialogError(null);
    setIsDialogOpen(true);
  };

  const handleTicketAction = async (ticket: SerializedTicket) => {
    try {
      setDialogError(null);
      const markTicketScan = await scanTicketAtEventAction({
        scannedData: {
          eventId: ticket.eventId,
          eventName: ticket.eventName,
          hash: ticket.ticketHash,
          shortId: ticket.shortId,
          orderId: ticket.orderId,
          ticketHolderName: ticket.ticketHolderName,
          ticketPayerEmail: ticket.ticketPayerEmail,
          price: ticket.price,
        },
      });

      if (markTicketScan) {
        refreshTickets();
        setIsDialogOpen(false);
        setDialogError(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : GENERIC_SCAN_ERROR;

      if (message === ALREADY_SCANNED_MESSAGE) {
        setDialogError(ALREADY_SCANNED_MESSAGE);
        return;
      }

      setDialogError(GENERIC_SCAN_ERROR);
      console.error(error);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTicket(null);
    setDialogError(null);
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-4 bg-neutral-800 p-4 rounded-lg text-neutral-400 max-lg:flex-col">
        <div className="w-full">
          <div className="flex max-lg:justify-between items-start gap-4 max-lg:w-full ">
            <div>
              Sold:{" "}
              <strong className={"max-lg:block"}>{ticketsSoldAmount}</strong>
            </div>
            <div>
              Scanned:{" "}
              <strong className={"max-lg:block"}>
                {ticketsScannedAmount}{" "}
                <em className={"font-light text-sm"}>
                  ({formatNumber(ticketsAttendedRatio * 100)}%)
                </em>
              </strong>
            </div>
            <div>
              Remaining:{" "}
              <strong className={"max-lg:block"}>
                {ticketsRemainingAmount}
              </strong>
            </div>
          </div>
          {shouldAutoRefresh && (
            <div className={"text-sm italic max-lg:hidden"}>
              Data automatically refreshes every {refreshInterval}s
            </div>
          )}
        </div>
        <div className={"min-w-40"}>
          <ActionButton
            onClick={refreshTickets}
            disabled={isRefreshing}
            size="sm"
            variant="secondary"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Now"}
          </ActionButton>
          {shouldAutoRefresh && (
            <div className={"text-sm italic lg:hidden mt-4"}>
              Data automatically refreshes every {refreshInterval}s
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-y-8">
        <div>
          <h2 className={"text-neutral-400"}>
            Unscanned tickets <em>({ticketsRemainingAmount})</em>
          </h2>
          <TicketsTable
            tickets={ticketsRemaining}
            onRowClick={handleTicketDetails}
          />
        </div>
        <div>
          <h2 className={"text-neutral-400"}>
            Scanned tickets <em>({ticketsScannedAmount})</em>
          </h2>
          <TicketsTable
            tickets={ticketsScanned}
            onRowClick={handleTicketDetails}
          />
        </div>
      </div>

      <TicketDetailsDialog
        ticket={selectedTicket}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onConfirmAction={handleTicketAction}
        scanningEnabled={scanningEnabled}
        actionError={dialogError}
        onClearError={() => setDialogError(null)}
      />
    </>
  );
}
