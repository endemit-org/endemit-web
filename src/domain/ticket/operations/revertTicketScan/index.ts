import "server-only";

import { prisma } from "@/lib/services/prisma";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { isEventCompleted } from "@/domain/event/businessLogic";
import { bustOnTicketScanReverted } from "@/lib/services/cache";

export const TICKET_NOT_SCANNED_MESSAGE =
  "This ticket has not been scanned yet.";

export const EVENT_ALREADY_COMPLETED_MESSAGE =
  "Cannot revert scan - the event has already ended.";

export const revertTicketScan = async (ticketId: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      order: { select: { userId: true } },
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== "SCANNED") {
    throw new Error(TICKET_NOT_SCANNED_MESSAGE);
  }

  // Fetch event from CMS to check if it's completed
  const event = await fetchEventFromCmsById(ticket.eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  if (isEventCompleted(event)) {
    throw new Error(EVENT_ALREADY_COMPLETED_MESSAGE);
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      attended: false,
      status: "PENDING",
      scanCount: 0,
    },
  });

  await bustOnTicketScanReverted(
    updatedTicket.id,
    updatedTicket.shortId,
    updatedTicket.eventId,
    ticket.order.userId
  );

  return updatedTicket;
};
