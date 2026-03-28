"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";
import { generateTicketImage } from "@/domain/ticket/operations/generateTicketImage";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { formatEventDateAndTime, formatPrice } from "@/lib/util/formatting";
import { splitArtistsIntoLines } from "@/domain/ticket/util";

interface GenerateTicketImageResult {
  success: boolean;
  image?: string;
  error?: string;
}

export async function generateTicketImageAction(
  ticketId: string
): Promise<GenerateTicketImageResult> {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }
    if (!user.permissions.includes(PERMISSIONS.TICKETS_READ_ALL)) {
      return { success: false, error: "User not authorized to generate tickets" };
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    const event = await fetchEventFromCmsById(ticket.eventId);

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (
      !event.promoImage?.src ||
      !event.date_start ||
      !event.venue ||
      !event.artists ||
      event.artists.length === 0
    ) {
      return { success: false, error: "Missing event data for ticket generation" };
    }

    const image = await generateTicketImage({
      shortId: ticket.shortId,
      hashId: ticket.ticketHash,
      qrData: JSON.stringify(ticket.qrContent),
      eventName: ticket.eventName,
      eventDetails: event.venue.name ?? "",
      eventDate: formatEventDateAndTime(event.date_start),
      attendeeName: ticket.ticketHolderName,
      attendeeEmail: ticket.ticketPayerEmail,
      artists: splitArtistsIntoLines(
        event.artists.map(artist => artist.name)
      ),
      price: formatPrice(Number(ticket.price)),
      coverImageUrl: event.promoImage.src,
    });

    return { success: true, image };
  } catch (error) {
    console.error("Error generating ticket image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Generation failed: ${errorMessage}`,
    };
  }
}
