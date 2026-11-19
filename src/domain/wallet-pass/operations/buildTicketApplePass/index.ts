import "server-only";

import type { Ticket } from "@prisma/client";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import {
  generateApplePass,
  type TicketPassState,
} from "../generateApplePass";
import {
  getPasskitWebServiceUrl,
  ticketPassAuthToken,
} from "../../utils/passkitWebService";

export function ticketPassState(
  ticket: Pick<Ticket, "status" | "attended">
): TicketPassState {
  if (ticket.status === "REFUNDED") return "refunded";
  // Banned shows as Cancelled — no need to say "banned" on someone's phone
  if (ticket.status === "CANCELLED" || ticket.status === "BANNED") {
    return "cancelled";
  }
  if (ticket.status === "SCANNED" || ticket.attended) return "used";
  return "ready";
}

interface BuildOptions {
  /**
   * The pass belongs to a previous owner (ticket transferred away): serve a
   * voided pass carrying their old token so Wallet keeps accepting it.
   */
  transferredAwayToken?: string;
}

/**
 * Builds the .pkpass for a ticket from its current DB state — used both for
 * the initial "Add to Apple Wallet" download and for PassKit update fetches.
 */
export async function buildTicketApplePass(
  ticket: Ticket,
  options: BuildOptions = {}
): Promise<Buffer> {
  const locale = ticket.locale === "en" ? "en" : "sl";
  const event = await fetchEventFromCmsById(ticket.eventId, locale);

  const webServiceUrl = getPasskitWebServiceUrl();
  const state: TicketPassState = options.transferredAwayToken
    ? "transferred"
    : ticketPassState(ticket);
  const authenticationToken =
    options.transferredAwayToken ??
    (webServiceUrl ? ticketPassAuthToken(ticket.id, ticket.orderId) : null);

  return generateApplePass({
    ticketId: ticket.id,
    shortId: ticket.shortId,
    ticketHash: ticket.ticketHash,
    eventId: ticket.eventId,
    eventName: ticket.eventName,
    eventDate: event?.date_start ?? null,
    eventDateEnd: event?.date_end ?? null,
    venueName: event?.venue?.name ?? null,
    venueAddress: event?.venue?.address ?? null,
    ticketHolderName: ticket.ticketHolderName,
    ticketPayerEmail: ticket.ticketPayerEmail,
    orderId: ticket.orderId,
    price: Number(ticket.price),
    qrContent: JSON.stringify(ticket.qrContent),
    locale,
    state,
    webService:
      webServiceUrl && authenticationToken
        ? { url: webServiceUrl, authenticationToken }
        : null,
  });
}
