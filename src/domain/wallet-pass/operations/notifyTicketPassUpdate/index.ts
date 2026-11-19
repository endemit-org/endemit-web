import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { sendPassUpdatePushes } from "../../utils/apns";
import {
  getPasskitWebServiceUrl,
  TICKET_PASS_TYPE_ID,
} from "../../utils/passkitWebService";

/**
 * Pushes an update to every Apple Wallet device that registered one of these
 * ticket passes. Almost no ticket has a registration, so this is normally a
 * single indexed query and nothing else. Never throws.
 */
export async function notifyTicketPassUpdate(
  ticketIds: string | string[]
): Promise<void> {
  const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];
  if (ids.length === 0 || !getPasskitWebServiceUrl()) return;

  try {
    const registrations = await prisma.walletPassRegistration.findMany({
      where: { passTypeId: TICKET_PASS_TYPE_ID, serialNumber: { in: ids } },
      select: { pushToken: true },
    });
    if (registrations.length === 0) return;

    const tokens = [...new Set(registrations.map(r => r.pushToken))];
    const { invalidTokens } = await sendPassUpdatePushes(
      tokens,
      TICKET_PASS_TYPE_ID
    );

    if (invalidTokens.length > 0) {
      await prisma.walletPassRegistration.deleteMany({
        where: { pushToken: { in: invalidTokens } },
      });
    }
  } catch (error) {
    console.error("[passkit] Failed to push ticket pass update:", error);
  }
}

/**
 * Same as notifyTicketPassUpdate, but runs after the response is sent so it
 * never slows down a scan. Call only after the DB change has committed —
 * the device fetches the pass as soon as the push lands. Falls back to
 * running inline when there is no request scope (scripts, jobs).
 */
export function scheduleTicketPassUpdate(ticketIds: string | string[]): void {
  try {
    after(() => notifyTicketPassUpdate(ticketIds));
  } catch {
    void notifyTicketPassUpdate(ticketIds);
  }
}
