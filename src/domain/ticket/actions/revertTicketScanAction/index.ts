"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  revertTicketScan,
  TICKET_NOT_SCANNED_MESSAGE,
  EVENT_ALREADY_COMPLETED_MESSAGE,
} from "@/domain/ticket/operations/revertTicketScan";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";

export const revertTicketScanAction = async ({
  ticketId,
}: {
  ticketId: string;
}) => {
  const user = await getCurrentUser();

  assert(user, "User not authenticated");
  assert(
    user?.permissions.includes(PERMISSIONS.TICKETS_UPDATE),
    "User not authorized to update tickets"
  );

  try {
    const updatedTicket = await revertTicketScan(ticketId);

    // Broadcast to ticket-specific channel so any open ticket page updates
    await broadcastToChannel(`ticket:${updatedTicket.shortId}`, "ticket_scan_reverted", {
      ticketId: updatedTicket.id,
      shortId: updatedTicket.shortId,
      status: "PENDING",
      revertedAt: new Date().toISOString(),
    });

    return { success: true as const, ticket: updatedTicket };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === TICKET_NOT_SCANNED_MESSAGE
    ) {
      return {
        success: false as const,
        reason: "not_scanned" as const,
        message: TICKET_NOT_SCANNED_MESSAGE,
      };
    }

    if (
      error instanceof Error &&
      error.message === EVENT_ALREADY_COMPLETED_MESSAGE
    ) {
      return {
        success: false as const,
        reason: "event_completed" as const,
        message: EVENT_ALREADY_COMPLETED_MESSAGE,
      };
    }

    return {
      success: false as const,
      reason: "unknown" as const,
      message:
        error instanceof Error
          ? error.message
          : "Ticket scan could not be reverted",
    };
  }
};
