"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import {
  initiateTicketTransfer,
  revokeTicketTransfer,
  acceptTicketTransfer,
  TicketTransferError,
} from "@/domain/ticket/operations/ticketTransfers";

type TransferActionResult =
  | { success: true }
  | { success: false; error: string };

function toResult(error: unknown): TransferActionResult {
  if (error instanceof TicketTransferError) {
    return { success: false, error: error.message };
  }
  console.error("Ticket transfer action failed:", error);
  return { success: false, error: "Something went wrong" };
}

export async function initiateTicketTransferAction(input: {
  ticketId: string;
  recipientEmail: string;
}): Promise<TransferActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    await initiateTicketTransfer({
      ticketId: input.ticketId,
      senderUserId: user.id,
      recipientEmail: input.recipientEmail,
    });
    return { success: true };
  } catch (error) {
    return toResult(error);
  }
}

export async function revokeTicketTransferAction(
  transferId: string
): Promise<TransferActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    await revokeTicketTransfer(transferId, user.id);
    return { success: true };
  } catch (error) {
    return toResult(error);
  }
}

export async function acceptTicketTransferAction(
  token: string
): Promise<TransferActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    await acceptTicketTransfer(token, user.id);
    return { success: true };
  } catch (error) {
    return toResult(error);
  }
}

/** Accept an offer surfaced in the profile (account email matches). */
export async function acceptIncomingTransferAction(
  transferId: string
): Promise<TransferActionResult> {
  const user = await getCurrentUser();
  if (!user?.email) return { success: false, error: "Not authenticated" };

  const transfer = await prisma.ticketTransfer.findUnique({
    where: { id: transferId },
    select: { token: true, recipientEmail: true },
  });
  if (
    !transfer ||
    transfer.recipientEmail !== user.email.toLowerCase()
  ) {
    return { success: false, error: "Transfer not found" };
  }

  try {
    await acceptTicketTransfer(transfer.token, user.id);
    return { success: true };
  } catch (error) {
    return toResult(error);
  }
}
