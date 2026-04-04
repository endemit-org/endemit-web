"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { notifyOnTicketDownload, TicketDownloadType } from "@/domain/notification/operations/notifyOnTicketDownload";

interface LogTicketDownloadParams {
  ticketShortId: string;
  downloadType: TicketDownloadType;
}

export async function logTicketDownloadAction({
  ticketShortId,
  downloadType,
}: LogTicketDownloadParams): Promise<{ success: boolean }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false };
    }

    const ticket = await prisma.ticket.findUnique({
      where: { shortId: ticketShortId },
      select: {
        shortId: true,
        eventName: true,
      },
    });

    if (!ticket) {
      return { success: false };
    }

    // Fire and forget - don't block on Discord notification
    if (user.email) {
      notifyOnTicketDownload({
        downloadType,
        ticketShortId: ticket.shortId,
        userEmail: user.email,
        userName: user.name ?? null,
        eventName: ticket.eventName,
      }).catch(() => {});
    }

    return { success: true };
  } catch (error) {
    console.error("Error logging ticket download:", error);
    return { success: false };
  }
}
