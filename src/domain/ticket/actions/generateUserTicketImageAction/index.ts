"use server";

import { getCurrentUser } from "@/lib/services/auth";
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

export async function generateUserTicketImageAction(
  shortId: string
): Promise<GenerateTicketImageResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const ticket = await prisma.ticket.findUnique({
      where: { shortId },
      include: {
        order: {
          select: {
            userId: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    // Verify user owns this ticket (either by userId or email)
    const isOwner =
      ticket.order.userId === user.id ||
      ticket.order.email === user.email ||
      ticket.ticketPayerEmail === user.email;

    if (!isOwner) {
      return { success: false, error: "Not authorized to download this ticket" };
    }

    // Only allow download for valid ticket statuses
    if (ticket.status === "CANCELLED" || ticket.status === "BANNED") {
      return { success: false, error: "This ticket is no longer valid" };
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
      template: ticket.isGuestList ? "guest" : "default",
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
