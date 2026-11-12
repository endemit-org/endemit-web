import "server-only";

import type { Ticket } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import {
  TICKET_PASS_TYPE_ID,
  ticketPassAuthToken,
  tokensEqual,
} from "../../utils/passkitWebService";

export type TicketPassAuth =
  | { kind: "owner"; ticket: Ticket }
  | { kind: "transferredAway"; ticket: Ticket; token: string };

/**
 * Checks an `ApplePass` token against a ticket pass.
 * - matches the current owner's token → full pass
 * - matches a token a device registered earlier (ticket since transferred)
 *   → voided pass for that previous owner
 * - anything else → null (401)
 */
export async function authorizeTicketPass(
  passTypeId: string,
  serialNumber: string,
  token: string | null
): Promise<TicketPassAuth | null> {
  if (!token || passTypeId !== TICKET_PASS_TYPE_ID) return null;

  const ticket = await prisma.ticket.findUnique({
    where: { id: serialNumber },
  });
  if (!ticket) return null;

  if (tokensEqual(token, ticketPassAuthToken(ticket.id, ticket.orderId))) {
    return { kind: "owner", ticket };
  }

  const previous = await prisma.walletPassRegistration.findFirst({
    where: { passTypeId, serialNumber, authToken: token },
    select: { id: true },
  });
  return previous ? { kind: "transferredAway", ticket, token } : null;
}
